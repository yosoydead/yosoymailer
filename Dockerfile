FROM node@16

WORKDIR /usr/src/app

COPY package.json .
RUN npm install
COPY . .

RUN ls -a

EXPOSE 5000

CMD ["npm", "run", "start"]
