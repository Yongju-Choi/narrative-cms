import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import type { ValidationIssue, ValidationResult } from "./types";

function result(issues: ValidationIssue[]): ValidationResult {
  return {
    valid: issues.every((i) => i.severity !== "error"),
    issues,
    checkedAt: new Date().toISOString(),
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function validateScene(sceneId: string): Promise<ValidationResult> {
  const scene = await prisma.scene.findUniqueOrThrow({
    where: { id: sceneId },
    include: {
      script: { select: { id: true, scenes: { select: { id: true } } } },
      eventBlocks: { orderBy: { orderIndex: "asc" } },
      premiumChoices: {
        include: { triggerBlock: { select: { sceneId: true } } },
      },
      assetSlots: {
        include: {
          assignment: { include: { asset: true } },
          promptSpecs: { select: { id: true, status: true, promptText: true, promptType: true, durationSec: true } },
        },
      },
    },
  });

  const issues: ValidationIssue[] = [];
  const validSceneIds = new Set(scene.script.scenes.map((s) => s.id));

  // SCENE_NO_BLOCKS
  if (scene.eventBlocks.length === 0) {
    issues.push({
      severity: "error",
      code: "SCENE_NO_BLOCKS",
      message: `씬 "${scene.title}"에 이벤트 블록이 없습니다.`,
      entityType: "Scene",
      entityId: scene.id,
    });
  }

  // CHOICE_CROSS_SCENE_TRIGGER (defensive)
  for (const pc of scene.premiumChoices) {
    if (pc.triggerBlock.sceneId !== scene.id) {
      issues.push({
        severity: "error",
        code: "CHOICE_CROSS_SCENE_TRIGGER",
        message: `선택지 "${pc.label}"의 트리거 블록이 다른 씬에 속합니다.`,
        entityType: "PremiumChoice",
        entityId: pc.id,
      });
    }
  }

  // CHOICE_INVALID_NEXT_SCENE / CHOICE_INVALID_FALLBACK_SCENE
  for (const pc of scene.premiumChoices) {
    if (pc.nextSceneId && !validSceneIds.has(pc.nextSceneId)) {
      issues.push({
        severity: "error",
        code: "CHOICE_INVALID_NEXT_SCENE",
        message: `선택지 "${pc.label}"의 nextSceneId가 유효하지 않습니다.`,
        entityType: "PremiumChoice",
        entityId: pc.id,
      });
    }
    if (pc.fallbackSceneId && !validSceneIds.has(pc.fallbackSceneId)) {
      issues.push({
        severity: "error",
        code: "CHOICE_INVALID_FALLBACK_SCENE",
        message: `선택지 "${pc.label}"의 fallbackSceneId가 유효하지 않습니다.`,
        entityType: "PremiumChoice",
        entityId: pc.id,
      });
    }
    // Self-referencing loop check
    if (pc.nextSceneId === scene.id) {
      issues.push({
        severity: "warning",
        code: "CHOICE_SELF_LOOP",
        message: `선택지 "${pc.label}"의 nextSceneId가 현재 씬을 가리킵니다 (루프).`,
        entityType: "PremiumChoice",
        entityId: pc.id,
      });
    }
  }

  // SLOT_DUAL_PARENT (defensive)
  for (const slot of scene.assetSlots) {
    if (slot.sceneId && slot.premiumChoiceId) {
      issues.push({
        severity: "error",
        code: "SLOT_DUAL_PARENT",
        message: `에셋 슬롯 "${slot.name}"이 씬과 선택지에 동시에 연결되어 있습니다.`,
        entityType: "AssetSlot",
        entityId: slot.id,
      });
    }
  }

  // SLOT_MISSING_REQUIRED_ASSET
  for (const slot of scene.assetSlots) {
    if (slot.required && !slot.assignment) {
      issues.push({
        severity: "error",
        code: "SLOT_MISSING_REQUIRED_ASSET",
        message: `필수 에셋 슬롯 "${slot.name}"에 에셋이 할당되지 않았습니다.`,
        entityType: "AssetSlot",
        entityId: slot.id,
      });
    }
  }

  // ASSET_FILE_MISSING
  for (const slot of scene.assetSlots) {
    if (slot.assignment) {
      const exists = await fileExists(slot.assignment.asset.filePath);
      if (!exists) {
        issues.push({
          severity: "warning",
          code: "ASSET_FILE_MISSING",
          message: `에셋 "${slot.assignment.asset.fileName}"의 파일이 존재하지 않습니다: ${slot.assignment.asset.filePath}`,
          entityType: "Asset",
          entityId: slot.assignment.asset.id,
        });
      }
    }
  }

  // ASSET_NOT_APPROVED (warning for required slots with draft assets)
  for (const slot of scene.assetSlots) {
    if (slot.required && slot.assignment && slot.assignment.asset.status === "draft") {
      issues.push({
        severity: "warning",
        code: "ASSET_NOT_APPROVED",
        message: `필수 슬롯 "${slot.name}"의 에셋 "${slot.assignment.asset.fileName}"이 아직 draft 상태입니다.`,
        entityType: "Asset",
        entityId: slot.assignment.asset.id,
      });
    }
  }

  // ORDER_INDEX_DUPLICATE
  const orderIndices = scene.eventBlocks.map((eb) => eb.orderIndex);
  const duplicates = orderIndices.filter((v, i) => orderIndices.indexOf(v) !== i);
  if (duplicates.length > 0) {
    issues.push({
      severity: "warning",
      code: "ORDER_INDEX_DUPLICATE",
      message: `이벤트 블록 orderIndex에 중복이 있습니다: ${[...new Set(duplicates)].join(", ")}`,
      entityType: "Scene",
      entityId: scene.id,
    });
  }

  // PREVIEW_INCOMPLETE
  if (scene.eventBlocks.length > 0) {
    const hasContent = scene.eventBlocks.some((eb) => eb.content.trim().length > 0);
    if (!hasContent) {
      issues.push({
        severity: "warning",
        code: "PREVIEW_INCOMPLETE",
        message: `씬 "${scene.title}"의 모든 이벤트 블록에 내용이 비어 있습니다.`,
        entityType: "Scene",
        entityId: scene.id,
      });
    }
  }

  // SLOT_NO_PROMPT_SPEC
  for (const slot of scene.assetSlots) {
    if (slot.promptSpecs.length === 0) {
      issues.push({
        severity: "warning",
        code: "SLOT_NO_PROMPT_SPEC",
        message: `에셋 슬롯 "${slot.name}"에 프롬프트 스펙이 없습니다.`,
        entityType: "AssetSlot",
        entityId: slot.id,
      });
    }
  }

  // PROMPT_SPEC validation
  for (const slot of scene.assetSlots) {
    for (const ps of slot.promptSpecs) {
      if (ps.status === "approved" && !ps.promptText.trim()) {
        issues.push({
          severity: "error",
          code: "PROMPT_SPEC_EMPTY_APPROVED",
          message: `승인된 프롬프트 스펙의 promptText가 비어 있습니다.`,
          entityType: "PromptSpec",
          entityId: ps.id,
        });
      }
      const videoTypes = ["video", "short_video", "video_motion"];
      if (videoTypes.includes(ps.promptType) && !ps.durationSec) {
        issues.push({
          severity: "warning",
          code: "PROMPT_SPEC_VIDEO_NO_DURATION",
          message: `영상용 프롬프트 스펙에 durationSec이 없습니다.`,
          entityType: "PromptSpec",
          entityId: ps.id,
        });
      }
    }
  }

  return result(issues);
}

export async function validateScript(scriptId: string): Promise<ValidationResult> {
  const script = await prisma.script.findUniqueOrThrow({
    where: { id: scriptId },
    include: {
      sequences: { select: { id: true, orderIndex: true }, orderBy: { orderIndex: "asc" } },
      scenes: {
        select: {
          id: true,
          sequenceId: true,
          premiumChoices: { select: { nextSceneId: true, fallbackSceneId: true } },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  const issues: ValidationIssue[] = [];

  if (script.scenes.length === 0) {
    issues.push({
      severity: "error",
      code: "SCRIPT_NO_SCENES",
      message: `스크립트 "${script.title}"에 씬이 없습니다.`,
      entityType: "Script",
      entityId: script.id,
    });
    return result(issues);
  }

  // SCRIPT_NO_SEQUENCES
  if (script.sequences.length === 0 && script.scenes.length > 0) {
    issues.push({
      severity: "warning",
      code: "SCRIPT_NO_SEQUENCES",
      message: `스크립트 "${script.title}"에 시퀀스가 없습니다.`,
      entityType: "Script",
      entityId: script.id,
    });
  }

  // SCENE_INVALID_SEQUENCE — scene references a sequence not in this script
  const validSeqIds = new Set(script.sequences.map((s) => s.id));
  for (const scene of script.scenes) {
    if (scene.sequenceId && !validSeqIds.has(scene.sequenceId)) {
      issues.push({
        severity: "error",
        code: "SCENE_INVALID_SEQUENCE",
        message: `씬이 잘못된 시퀀스를 참조합니다.`,
        entityType: "Scene",
        entityId: scene.id,
      });
    }
  }

  // SEQUENCE_ORDER_DUPLICATE
  const seqIndices = script.sequences.map((s) => s.orderIndex);
  const seqDups = seqIndices.filter((v, i) => seqIndices.indexOf(v) !== i);
  if (seqDups.length > 0) {
    issues.push({
      severity: "warning",
      code: "SEQUENCE_ORDER_DUPLICATE",
      message: `시퀀스 orderIndex에 중복이 있습니다: ${[...new Set(seqDups)].join(", ")}`,
      entityType: "Script",
      entityId: script.id,
    });
  }

  // SEQUENCE_EMPTY — sequences with no scenes
  for (const seq of script.sequences) {
    const sceneCount = script.scenes.filter((s) => s.sequenceId === seq.id).length;
    if (sceneCount === 0) {
      issues.push({
        severity: "warning",
        code: "SEQUENCE_EMPTY",
        message: `시퀀스에 씬이 없습니다.`,
        entityType: "Sequence",
        entityId: seq.id,
      });
    }
  }

  // Check scene navigation
  const hasAnyNavigation = script.scenes.some((s) =>
    s.premiumChoices.some((pc) => pc.nextSceneId || pc.fallbackSceneId)
  );
  if (!hasAnyNavigation && script.scenes.length > 1) {
    issues.push({
      severity: "warning",
      code: "SCRIPT_NO_SCENE_NAVIGATION",
      message: `스크립트에 씬 연결(nextSceneId/fallbackSceneId)이 없습니다.`,
      entityType: "Script",
      entityId: script.id,
    });
  }

  for (const scene of script.scenes) {
    const sceneResult = await validateScene(scene.id);
    issues.push(...sceneResult.issues);
  }

  return result(issues);
}

export async function validateProject(projectId: string): Promise<ValidationResult> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { scripts: { select: { id: true } } },
  });

  const issues: ValidationIssue[] = [];

  if (project.scripts.length === 0) {
    issues.push({
      severity: "error",
      code: "PROJECT_NO_SCRIPTS",
      message: `프로젝트 "${project.name}"에 스크립트가 없습니다.`,
      entityType: "Project",
      entityId: project.id,
    });
    return result(issues);
  }

  for (const script of project.scripts) {
    const scriptResult = await validateScript(script.id);
    issues.push(...scriptResult.issues);
  }

  return result(issues);
}
