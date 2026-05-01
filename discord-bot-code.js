/**
 * Discord Anti-Raid Bot (Verification System)
 * 
 * Requirement: npm install discord.js
 */

const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 설정
const TOKEN = 'YOUR_DISCORD_BOT_TOKEN'; // 여기에 봇 토큰 입력
const VERIFY_CHANNEL_ID = 'YOUR_CHANNEL_ID'; // 인증 채널 ID
const VERIFY_URL = 'https://your-verification-site.com'; // 웹사이트 주소
const MEMBER_ROLE_ID = 'YOUR_ROLE_ID'; // 승인된 유저에게 부여할 역할 ID

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// 인증 버튼 메시지 생성 커맨드 (예: !setup)
client.on('messageCreate', async (message) => {
  if (message.content === '!setup' && message.member.permissions.has('Administrator')) {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ 서버 보안 인증')
      .setDescription(
        '최근 인도네시아 극단주의 단체의 레이드가 빈번하게 발생하고 있습니다.\n' +
        '서버를 이용하시려면 아래 버튼을 눌러 **한국 아이피(KR IP) 인증**을 완료해주세요.\n\n' +
        '⚠️ **주의사항**\n' +
        '- 해외 아이피는 접속이 차단됩니다.\n' +
        '- VPN 사용 시 인증이 거부됩니다.\n' +
        '- 인증 후 자동으로 멤버 역할이 부여됩니다.'
      )
      .setColor('#5865F2')
      .setThumbnail(client.user.displayAvatarURL());

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('인증 시작하기')
        .setURL(VERIFY_URL) // 실제 배포된 사이트 주소
        .setStyle(ButtonStyle.Link)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    message.delete();
  }
});

/**
 * [알림] 
 * 웹사이트에서 인증 성공 시 서버(Backend)에서 봇 API를 호출하여 역할을 부여해야 합니다.
 * 아래는 역할을 부여하는 예시 함수입니다.
 */
async function assignRole(guildId, userId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    const role = guild.roles.cache.get(MEMBER_ROLE_ID);
    
    if (role) {
      await member.roles.add(role);
      console.log(`Role assigned to ${member.user.tag}`);
    }
  } catch (error) {
    console.error('Failed to assign role:', error);
  }
}

client.login(TOKEN);
