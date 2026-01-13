-- CreateTable
CREATE TABLE "Campanha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "pixelId" TEXT,
    "accessToken" TEXT,
    "eventToken" TEXT,
    "conversionId" TEXT,
    "linkCampanha" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "cliques" INTEGER NOT NULL DEFAULT 0,
    "conversoes" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campanha_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
