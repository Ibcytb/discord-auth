import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// --- [설정값] ---
const TOKEN = process.env.BOT_TOKEN; 
const MEMBER_ROLE_ID = '1457004890307039447'; 
const VERIFY_URL = 'https://ivyauth.netlify.app/';
const GUILD_ID = '1457002878286827533'; // 서버 ID
const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // 반드시 켜져 있어야 함
  ],
});

client.on('ready', () => {
  console.log(`🚀 봇 온라인: ${client.user.tag}`);
  console.log(`인텐트 설정: Guilds, GuildMembers, GuildMessages, MessageContent`);
});

// 메시지 수신 테스트
client.on('messageCreate', async (message) => {
  // 1. 봇이 읽은 모든 메시지를 로그에 출력 (테스트용)
  console.log(`[메시지 수신] 작성자: ${message.author.tag}, 내용: ${message.content}`);

  if (message.author.bot) return; // 봇 메시지 무시

  if (message.content === '!setup') {
    console.log('!setup 명령어 인식됨');
    
    if (!message.member.permissions.has('Administrator')) {
      console.log('권한 부족: 관리자가 아님');
      return message.reply('관리자 권한이 필요합니다.');
    }

    const embed = new EmbedBuilder()
      .setTitle('🛡️ 서버 보안 인증')
      .setDescription('최근 발생하고 있는 레이드 및 테러 방지를 위해 보안 인증을 실시합니다.\n아래 버튼을 눌러 **한국 아이피(KR IP) 인증**을 완료해주세요.')
      .setColor('#5865F2');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('인증 시작하기')
        .setURL(VERIFY_URL)
        .setStyle(ButtonStyle.Link)
    );

    try {
      await message.channel.send({ embeds: [embed], components: [row] });
      console.log('✅ 인증 메시지 전송 성공');
      await message.delete();
    } catch (err) {
      console.error('❌ 메시지 전송 실패:', err);
    }
  }
});

// 역할 부여 API
app.get('/verify-success', async (req, res) => {
  const { userId } = req.query;
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);
    const role = guild.roles.cache.get(MEMBER_ROLE_ID);
    if (role) {
      await member.roles.add(role);
      return res.send('OK');
    }
    res.status(404).send('Role Not Found');
  } catch (e) {
    res.status(500).send('Error');
  }
});

app.get('/', (req, res) => res.send('Bot is Running'));
app.listen(PORT, () => console.log(`서버 포트 ${PORT} 가동 중`));
client.login(TOKEN);
