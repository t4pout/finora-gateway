-- AlterTable
ALTER TABLE "PaginaOferta" ADD COLUMN     "conversoes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "distribuicao" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "testeAB" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "versaoOriginal" TEXT,
ADD COLUMN     "visualizacoes" INTEGER NOT NULL DEFAULT 0;
