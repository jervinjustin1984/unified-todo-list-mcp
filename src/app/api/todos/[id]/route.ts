import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { archiveTodo, updateTodo } from "@/lib/todos-service";

const statusSchema = z.enum(["open", "in_progress", "completed"]);
const prioritySchema = z.enum(["low", "medium", "high"]);

const patchBodySchema = z
  .object({
    name: z.string().min(1).max(2000).optional(),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    category: z.string().max(200).nullable().optional(),
    restore: z.boolean().optional(),
  })
  .refine(
    (o) =>
      o.name !== undefined ||
      o.status !== undefined ||
      o.priority !== undefined ||
      o.category !== undefined ||
      o.restore === true,
    { message: "At least one field must be provided" },
  );

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: { message: "Invalid id", code: "bad_request" } },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body", code: "bad_request" } },
      { status: 400 },
    );
  }

  const parsed = patchBodySchema.safeParse(body);
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
    const todo = await updateTodo(id, parsed.data, auth.userId);
    if (!todo) {
      return NextResponse.json(
        { error: { message: "Todo not found", code: "not_found" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ todo });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: { message, code: "server_error" } },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: { message: "Invalid id", code: "bad_request" } },
      { status: 400 },
    );
  }

  try {
    const todo = await archiveTodo(id, auth.userId);
    if (!todo) {
      return NextResponse.json(
        { error: { message: "Todo not found", code: "not_found" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ todo });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: { message, code: "server_error" } },
      { status: 500 },
    );
  }
}
