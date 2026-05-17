import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  DEFAULT_REST_SOURCE,
  SOURCE_MAX_LENGTH,
} from "@/lib/todo-source";
import { createTodo, listTodos } from "@/lib/todos-service";
import type { TodoPriority, TodoStatus } from "@/lib/types";

const statusSchema = z.enum(["open", "in_progress", "completed"]);
const prioritySchema = z.enum(["low", "medium", "high"]);

const postBodySchema = z.object({
  name: z.string().min(1).max(2000),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  category: z.string().max(200).nullable().optional(),
  source: z.string().min(1).max(SOURCE_MAX_LENGTH).optional(),
});

function parseBool(v: string | null): boolean | undefined {
  if (v === null) return undefined;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") as TodoStatus | null;
  const priority = searchParams.get("priority") as TodoPriority | null;
  const category = searchParams.get("category") ?? undefined;
  const includeArchived = parseBool(searchParams.get("includeArchived")) ?? false;
  const archivedOnly = parseBool(searchParams.get("archivedOnly")) ?? false;

  let statusParsed: TodoStatus | undefined;
  let priorityParsed: TodoPriority | undefined;
  if (status) {
    const s = statusSchema.safeParse(status);
    if (!s.success) {
      return NextResponse.json(
        { error: { message: "Invalid status", code: "bad_request" } },
        { status: 400 },
      );
    }
    statusParsed = s.data;
  }
  if (priority) {
    const p = prioritySchema.safeParse(priority);
    if (!p.success) {
      return NextResponse.json(
        { error: { message: "Invalid priority", code: "bad_request" } },
        { status: 400 },
      );
    }
    priorityParsed = p.data;
  }

  try {
    const todos = await listTodos({
      userId: auth.userId,
      q,
      status: statusParsed,
      priority: priorityParsed,
      category,
      includeArchived,
      archivedOnly,
    });
    return NextResponse.json({ todos });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: { message, code: "server_error" } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body", code: "bad_request" } },
      { status: 400 },
    );
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "validation_error",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const { source, ...rest } = parsed.data;
    const todo = await createTodo({
      ...rest,
      userId: auth.userId,
      source: source ?? DEFAULT_REST_SOURCE,
    });
    return NextResponse.json({ todo }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: { message, code: "server_error" } },
      { status: 500 },
    );
  }
}
