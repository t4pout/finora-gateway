-- CreateEnum
CREATE TYPE "TipoUser" AS ENUM ('ADMIN', 'VENDEDOR', 'AFILIADO');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ATIVO', 'INATIVO', 'PENDENTE', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('FISICO', 'DIGITAL');

-- CreateEnum
CREATE TYPE "StatusVenda" AS ENUM ('PENDENTE', 'APROVADA', 'CANCELADA', 'REEMBOLSADA', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "StatusComissao" AS ENUM ('PENDENTE', 'PAGA', 'CANCELADA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT,
    "tipo" "TipoUser" NOT NULL DEFAULT 'VENDEDOR',
    "status" "Status" NOT NULL DEFAULT 'ATIVO',
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoProduto" NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "comissao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'ATIVO',
    "estoque" INTEGER,
    "imagem" TEXT,
    "arquivoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" "StatusVenda" NOT NULL DEFAULT 'PENDENTE',
    "metodoPagamento" TEXT NOT NULL,
    "pixQrCode" TEXT,
    "pixCopiaECola" TEXT,
    "compradorNome" TEXT NOT NULL,
    "compradorEmail" TEXT NOT NULL,
    "compradorCpf" TEXT,
    "compradorTel" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "produtoId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL,
    "status" "StatusComissao" NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendaId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afiliacoes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "comissao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'ATIVO',
    "cliques" INTEGER NOT NULL DEFAULT 0,
    "conversoes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "afiliadoId" TEXT NOT NULL,

    CONSTRAINT "afiliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "afiliacoes_codigo_key" ON "afiliacoes"("codigo");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afiliacoes" ADD CONSTRAINT "afiliacoes_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
