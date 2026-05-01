import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// --- 설정 ---
const TOKEN = process.env.BOT_TOKEN; // Render 환경변수로 설정할 예정
const MEMBER_ROLE_ID = '1499657972563836943'; 
const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 웹사이트에서 인증 성공 시 호출할 엔드포인트
app.get('/verify-success', async (req, res) => {
  const { userId, guildId } = req.query;

  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    const role = guild.roles.cache.get(MEMBER_ROLE_ID);

    if (role) {
      await member.roles.add(role);
      console.log(`✅ 역할 부여 성공: ${member.user.tag}`);
      return res.send('SUCCESS');
    }
    res.status(404).send('ROLE NOT FOUND');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('SERVER ERROR');
  }
});

// Render에서 서버가 살아있는지 확인하는 용도
app.get('/', (req, res) => res.send('Bot is running!'));

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  // 봇이 로그인된 후 서버 시작
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
});

client.login(TOKEN);
