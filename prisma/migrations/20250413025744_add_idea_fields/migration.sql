-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "ideaDescription" TEXT,
ADD COLUMN     "ideaLink" TEXT,
ADD COLUMN     "ideaTitle" TEXT,
ADD COLUMN     "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "teamSize" INTEGER NOT NULL DEFAULT 5,
    "deadline" TIMESTAMP(3),
    "eventStarted" BOOLEAN NOT NULL DEFAULT false,
    "eventEnded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);
