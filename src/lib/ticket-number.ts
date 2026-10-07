import prisma from "./prisma";

export type TicketType = "INCIDENT" | "REQUEST" | "COMPLAINT";

const TYPE_PREFIX: Record<TicketType, string> = {
  INCIDENT: "INC",
  REQUEST: "REQ",
  COMPLAINT: "CMP",
};

export async function generateTicketNumber(type: TicketType): Promise<string> {
  const prefix = TYPE_PREFIX[type] || "TKT";
  const year = new Date().getFullYear();
  const searchPattern = `${prefix}-${year}-%`;

  // Find latest ticket with this prefix and year
  const latestTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: `${prefix}-${year}-`,
      },
    },
    orderBy: {
      ticketNumber: "desc",
    },
    select: {
      ticketNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestTicket?.ticketNumber) {
    const parts = latestTicket.ticketNumber.split("-");
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(5, "0");
  return `${prefix}-${year}-${paddedSeq}`;
}

