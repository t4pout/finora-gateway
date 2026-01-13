-- AlterTable
ALTER TABLE "Campanha" ADD COLUMN     "paginaOfertaId" TEXT;

-- CreateTable
CREATE TABLE "PaginaOferta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaginaOferta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaginaOferta" ADD CONSTRAINT "PaginaOferta_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_paginaOfertaId_fkey" FOREIGN KEY ("paginaOfertaId") REFERENCES "PaginaOferta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
