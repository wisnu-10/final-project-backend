import { prisma } from "../src/config/prisma-client.config";

function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date("1970-01-01T00:00:00Z");
  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

async function main() {
  const shifts = await prisma.shift.findMany({
    where: { deletedAt: null }
  });

  console.log("Current Shifts:", shifts.length);

  if (shifts.length === 0) {
    console.log("Seeding default shift...");
    await prisma.shift.create({
      data: {
        shiftName: "Pagi",
        startTime: parseTimeToDate("08:00"),
        endTime: parseTimeToDate("17:00"),
      }
    });
    console.log("Default shift created successfully.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
