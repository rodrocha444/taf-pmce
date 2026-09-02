FROM node:22-alpine

WORKDIR /app

# Instala dependências aproveitando cache de camadas do Docker
COPY package.json package-lock.json* ./
RUN npm install

# Copia o código fonte do projeto
COPY . .

# Porta configurada no Vite
EXPOSE 5555

# Comando para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]
