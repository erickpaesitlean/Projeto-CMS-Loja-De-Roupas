import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Hash das senhas (senha padrão: "123456")
  const senhaHash = await bcrypt.hash('123456', 10);

  // Criar ou atualizar usuário gerente 1
  const gerente1 = await prisma.colaborador.upsert({
    where: { email: 'gerente1@loja.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'gerente1@loja.com',
      senha: senhaHash,
      status: 'ativo',
      cargo: 'Gerente',
    },
  });

  console.log('✅ Gerente 1 criado:', gerente1.email);

  // Criar ou atualizar usuário gerente 2
  const gerente2 = await prisma.colaborador.upsert({
    where: { email: 'gerente2@loja.com' },
    update: {},
    create: {
      nome: 'Maria Santos',
      email: 'gerente2@loja.com',
      senha: senhaHash,
      status: 'ativo',
      cargo: 'Gerente',
    },
  });

  console.log('✅ Gerente 2 criado:', gerente2.email);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de acesso:');
  console.log('Gerente 1:');
  console.log('  Email: gerente1@loja.com');
  console.log('  Senha: 123456');
  console.log('\nGerente 2:');
  console.log('  Email: gerente2@loja.com');
  console.log('  Senha: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



