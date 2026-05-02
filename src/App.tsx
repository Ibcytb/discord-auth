// src/App.tsx 전체 코드
import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Globe, Loader2, LogIn, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

type VerificationStatus = 'idle' | 'checking' | 'success' | 'failed' | 'vpn-detected' | 'wrong-region';

interface IPInfo {
  ip: string;
  country_name: string;
  country_code: string;
  org: string;
}

interface DiscordUser {
  id: string;
  username: string;
}

// ==========================================
// [설정] 본인의 정보로 수정하세요
// ==========================================
const CLIENT_ID = '1499652919010529341'; 
const REDIRECT_URI = window.location.origin; 
const BOT_SERVER_URL = 'https://discord-auth-xdtr.onrender.com'; 
const GUILD_ID = '1457002878286827533'; 
// ==========================================

const App: React.FC = () => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [isDiscordLoggedIn, setIsDiscordLoggedIn] = useState(false);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');
    const tokenType = fragment.get('token_type');

    if (accessToken && tokenType) {
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchDiscordUser(accessToken, tokenType);
    }
  }, []);

  const fetchDiscordUser = async (token: string, type: string) => {
    try {
      const response = await axios.get('https://discord.com/api/users/@me', {
        headers: { authorization: `${type} ${token}` }
      });
      setDiscordUser(response.data);
      setIsDiscordLoggedIn(true);
    } catch (error) {
      console.error('Discord fetch error', error);
      alert('디스코드 정보를 가져오지 못했습니다.');
    }
  };

  const handleDiscordLogin = () => {
    const scope = encodeURIComponent('identify');
    const authUrl = `https://discord.com/api/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`;
    window.location.href = authUrl;
  };

  const checkIP = async () => {
    setStatus('checking');
    try {
      const response = await axios.get('https://ipapi.co/json/');
      const data = response.data;
      setIpInfo(data);

      if (data.country_code !== 'KR') {
        setStatus('wrong-region');
        return;
      }

      const vpnKeywords = ['hosting', 'cloud', 'server', 'datacenter', 'vpn', 'proxy', 'digitalocean', 'google cloud', 'aws', 'amazon', 'linode', 'vultr', 'ovh'];
      const org = data.org.toLowerCase();
      const isSuspectedVPN = vpnKeywords.some(keyword => org.includes(keyword));

      if (isSuspectedVPN) {
        setStatus('vpn-detected');
      } else {
        // [핵심] 성공 시 Render 서버로 신호 전송
        try {
          await axios.get(`${BOT_SERVER_URL}/verify-success?userId=${discordUser?.id}&guildId=${GUILD_ID}`);
          setStatus('success');
        } catch (error) {
          console.error('Bot server error', error);
          alert('봇 서버 연결에 실패했습니다. (Render 서버 상태를 확인하세요)');
          setStatus('success'); 
        }
      }
    } catch (error) {
      console.error('IP Check error', error);
      setStatus('failed');
    }
  };

  const reset = () => {
    setStatus('idle');
    setIsDiscordLoggedIn(false);
    setDiscordUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-800 rounded-full blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-900">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">보안 인증 시스템</h1>
          <p className="text-slate-400 text-sm mt-2 text-center">해외 공격 차단 및 한국 사용자 전용 인증 페이지입니다.</p>
        </div>

        <AnimatePresence mode="wait">
          {!isDiscordLoggedIn ? (
            <motion.div key="login" className="space-y-4">
              <button onClick={handleDiscordLogin} className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" /> Discord 계정 연동하기
              </button>
            </motion.div>
          ) : status === 'idle' ? (
            <motion.div key="ip-check" className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center text-sm">
                환영합니다, <span className="text-blue-400 font-bold">{discordUser?.username}</span>님!<br/>
                인증 완료 시 멤버 역할이 자동 부여됩니다.
              </div>
              <button onClick={checkIP} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                <Globe className="w-5 h-5" /> 인증 완료하고 역할 받기
              </button>
            </motion.div>
          ) : status === 'checking' ? (
            <motion.div key="loading" className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-300 text-sm">보안 분석 중...</p>
            </motion.div>
          ) : (
            <motion.div key="result" className="text-center space-y-4">
              {status === 'success' && (
                <>
                  <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-green-500">인증 성공!</h2>
                  <p className="text-slate-400 text-sm">성공적으로 확인되었습니다. 이제 서버를 이용하실 수 있습니다.</p>
                </>
              )}
              {status === 'wrong-region' && <p className="text-red-500">해외 접속이 차단되었습니다.</p>}
              {status === 'vpn-detected' && <p className="text-amber-500">VPN 사용이 감지되었습니다.</p>}
              <button onClick={reset} className="text-slate-500 text-sm hover:underline mt-4">처음으로</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default App;
