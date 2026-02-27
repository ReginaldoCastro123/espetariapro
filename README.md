# 🔥 EspetariaPro

Sistema completo de gestão para espetarias, bares e pequenos restaurantes.

![EspetariaPro Logo](logo-dark.png)

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Uso](#uso)
- [Planos](#planos)
- [API](#api)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 📝 Sobre

O **EspetariaPro** é um sistema SaaS (Software as a Service) completo desenvolvido para auxiliar na gestão de espetarias, bares e pequenos restaurantes. O sistema oferece controle de mesas, pedidos, produtos, usuários e dashboard financeiro, tudo em uma interface moderna e intuitiva.

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- Cadastro de empresa com trial gratuito de 15 dias
- Login com JWT (JSON Web Tokens)
- Refresh tokens para sessões persistentes
- Controle de acesso por roles (Admin e Garçom)
- Isolamento total de dados entre empresas (multi-tenant)

### 📊 Dashboard
- Total vendido hoje e no mês
- Mesas abertas em tempo real
- Produtos mais vendidos
- Formas de pagamento mais utilizadas
- Gráficos de vendas por dia
- Controle de assinatura

### 🍖 Produtos
- Cadastro de produtos com nome, preço e categoria
- Ativação/desativação de produtos
- Filtragem por categoria
- Busca rápida

### 🪑 Mesas
- Cadastro ilimitado de mesas
- Controle de status (Aberta/Fechada)
- Adição de pedidos às mesas
- Fechamento com cálculo automático

### 📝 Pedidos
- Criação de pedidos por mesa
- Adição de múltiplos itens
- Controle de quantidades
- Fechamento com forma de pagamento
- Cancelamento (apenas admin)

### 👥 Usuários (Admin)
- Cadastro de garçons e administradores
- Controle de permissões
- Reset de senha
- Ativação/desativação

### 💳 Assinatura
- Plano Free com limitações
- Plano Enterprise ilimitado
- Controle de expiração automático
- Upgrade e renovação

## 🛠 Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma ORM** - Acesso ao banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração

## 🏗 Arquitetura

```
espetariapro/
├── backend/                 # API REST Node.js + Express
│   ├── src/
│   │   ├── config/         # Configurações (database, env)
│   │   ├── modules/        # Módulos da aplicação
│   │   │   ├── auth/       # Autenticação
│   │   │   ├── users/      # Usuários
│   │   │   ├── products/   # Produtos
│   │   │   ├── tables/     # Mesas
│   │   │   ├── orders/     # Pedidos
│   │   │   ├── dashboard/  # Dashboard
│   │   │   ├── subscriptions/ # Assinaturas
│   │   │   └── integrations/  # Integrações futuras
│   │   ├── middlewares/    # Middlewares (auth, roles, subscription)
│   │   └── utils/          # Utilitários
│   ├── prisma/
│   │   └── schema.prisma   # Schema do banco de dados
│   └── Dockerfile
├── frontend/               # Aplicação Next.js
│   ├── src/
│   │   ├── app/           # Páginas (App Router)
│   │   ├── components/    # Componentes
│   │   ├── contexts/      # Contextos React
│   │   ├── services/      # Serviços de API
│   │   └── types/         # Tipos TypeScript
│   ├── public/            # Arquivos estáticos
│   └── Dockerfile
├── docker-compose.yml     # Configuração Docker
└── README.md
```

## 🚀 Instalação

### Pré-requisitos
- Docker e Docker Compose
- ou Node.js 20+ e PostgreSQL

### Usando Docker (Recomendado)

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/espetariapro.git
cd espetariapro
```

2. Inicie os containers:
```bash
docker-compose up -d
```

3. Acesse a aplicação:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3333

4. Execute as migrações do banco (primeira vez):
```bash
docker-compose exec backend npx prisma migrate deploy
```

5. (Opcional) Popule o banco com dados de demonstração:
```bash
docker-compose exec backend npm run db:seed
```

### Instalação Manual

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações
npx prisma migrate dev
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📖 Uso

### Credenciais de Demonstração
- **Admin**: admin@espetariapro.com / admin123
- **Garçom**: waiter@espetariapro.com / waiter123

### Fluxo Básico

1. **Login**: Acesse com suas credenciais
2. **Dashboard**: Visualize estatísticas e métricas
3. **Produtos**: Cadastre seus produtos e categorias
4. **Mesas**: Cadastre as mesas do estabelecimento
5. **Pedidos**: Abra mesas e adicione pedidos
6. **Fechamento**: Feche mesas e pedidos com a forma de pagamento

## 💎 Planos

### 🆓 Free (Trial 15 dias)
- ✅ Máximo 10 mesas ativas
- ✅ Máximo 5 usuários
- ✅ Histórico de 30 dias
- ✅ Todas as funcionalidades durante o trial

### 💎 Enterprise - R$ 39,90/mês
- ✅ Mesas ilimitadas
- ✅ Usuários ilimitados
- ✅ Histórico completo
- ✅ Dashboard avançado
- ✅ Controle por garçom
- ✅ Dados ilimitados

## 🔌 API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Cadastrar empresa
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Renovar token
- `GET /api/auth/me` - Dados do usuário logado

#### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Desativar produto

#### Mesas
- `GET /api/tables` - Listar mesas
- `POST /api/tables` - Criar mesa
- `POST /api/tables/:id/open` - Abrir mesa
- `POST /api/tables/:id/close` - Fechar mesa

#### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Criar pedido
- `POST /api/orders/:id/close` - Fechar pedido
- `POST /api/orders/:id/cancel` - Cancelar pedido

#### Dashboard
- `GET /api/dashboard/stats` - Estatísticas
- `GET /api/dashboard/sales-by-waiter` - Vendas por garçom

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, siga os passos:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**EspetariaPro Team**

---

<p align="center">
  Feito com 🔥 para espetarias de todo o Brasil
</p>
