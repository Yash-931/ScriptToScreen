-- CreateTable
CREATE TABLE "Charecter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "Charecter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story_Charecters" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "charecter_id" TEXT NOT NULL,

    CONSTRAINT "Story_Charecters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_Charecters_story_id_charecter_id_key" ON "Story_Charecters"("story_id", "charecter_id");

-- AddForeignKey
ALTER TABLE "Charecter" ADD CONSTRAINT "Charecter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_Charecters" ADD CONSTRAINT "Story_Charecters_charecter_id_fkey" FOREIGN KEY ("charecter_id") REFERENCES "Charecter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_Charecters" ADD CONSTRAINT "Story_Charecters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
