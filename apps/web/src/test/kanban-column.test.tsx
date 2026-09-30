import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeApproval } from "./fixtures";
import type { ApprovalRequest } from "@studio/types";

vi.mock("@studio/ui", () => ({
  Card: ({ children, onClick, className }: any) => <div data-testid="card" className={className} onClick={onClick}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  Button: ({ children, onClick, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="" />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  AlertDialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("lucide-react", () => ({
  XCircle: () => <svg />,
  CheckCircle2: () => <svg />,
  Clock: () => <svg data-testid="empty-clock" />,
  ChevronRight: () => <svg />,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { KanbanColumn } from "@/components/approvals/kanban-column";

describe("KanbanColumn", () => {
  const onUpdateStatus = vi.fn();
  const checkCanManage = vi.fn(() => false);
  const onCardClick = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("renders the column title", () => {
    render(
      <KanbanColumn
        title="Pending"
        requests={[]}
        onUpdateStatus={onUpdateStatus}
        checkCanManage={checkCanManage}
        onCardClick={onCardClick}
        isUpdating={false}
      />,
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows count badge with 0 when no requests", () => {
    render(
      <KanbanColumn
        title="Approved"
        requests={[]}
        onUpdateStatus={onUpdateStatus}
        checkCanManage={checkCanManage}
        onCardClick={onCardClick}
        isUpdating={false}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows empty state message when no requests", () => {
    render(
      <KanbanColumn
        title="Rejected"
        requests={[]}
        onUpdateStatus={onUpdateStatus}
        checkCanManage={checkCanManage}
        onCardClick={onCardClick}
        isUpdating={false}
      />,
    );
    expect(screen.getByText("No rejected requests")).toBeInTheDocument();
  });

  it("renders a card for each request", () => {
    const requests: ApprovalRequest[] = [
      makeApproval({ id: "1", requester: "Alice" }),
      makeApproval({ id: "2", requester: "Bob" }),
    ];
    render(
      <KanbanColumn
        title="Pending"
        requests={requests}
        onUpdateStatus={onUpdateStatus}
        checkCanManage={checkCanManage}
        onCardClick={onCardClick}
        isUpdating={false}
      />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows correct count badge", () => {
    const requests = [makeApproval({ id: "1" }), makeApproval({ id: "2" }), makeApproval({ id: "3" })];
    render(
      <KanbanColumn
        title="Pending"
        requests={requests}
        onUpdateStatus={onUpdateStatus}
        checkCanManage={checkCanManage}
        onCardClick={onCardClick}
        isUpdating={false}
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not show empty state when requests exist", () => {
    const requests = [makeApproval({ id: "1", requester: "Alice" })];
    render(
      <KanbanColumn
        title="Pending"
        requests={requests}
        onUpdateStatus={onUpdateStatus}
        checkCanManage={checkCanManage}
        onCardClick={onCardClick}
        isUpdating={false}
      />,
    );
    expect(screen.queryByText("No pending requests")).not.toBeInTheDocument();
  });

  it("calls checkCanManage for each request", () => {
    const requests = [makeApproval({ id: "1" }), makeApproval({ id: "2" })];
    render(
      <KanbanColumn
        title="Pending"
        requests={requests}
        onUpdateStatus={onUpdateStatus}
        checkCanManage={checkCanManage}
        onCardClick={onCardClick}
        isUpdating={false}
      />,
    );
    expect(checkCanManage).toHaveBeenCalledTimes(2);
  });
});
