-- AlterTable
ALTER TABLE "Campanha" ADD COLUMN     "distribuicao" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "paginaAlternativaId" TEXT,
ADD COLUMN     "testeAB" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_paginaAlternativaId_fkey" FOREIGN KEY ("paginaAlternativaId") REFERENCES "PaginaOferta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
