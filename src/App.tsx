import React, { useState } from 'react';
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

// --- Discord OAuth 설정 ---
// 본인의 Discord Developer Portal에서 Client ID를 가져와서 입력하세요.
const CLIENT_ID = '1499652919010529341'; 
// 배포된 사이트 주소를 Redirect URI로 등록해야 합니다. (예: https://your-site.com)
const REDIRECT_URI = window.location.origin; 

interface DiscordUser {
  id: string;
  username: string;
}

const App: React.FC = () => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [isDiscordLoggedIn, setIsDiscordLoggedIn] = useState(false);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);

  // 페이지 로드 시 URL 해시에서 토큰 확인
  React.useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');
    const tokenType = fragment.get('token_type');

    if (accessToken && tokenType) {
      // 해시 정보 제거 (보안상 깔끔하게)
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
      console.error('Discord user fetch failed', error);
      alert('디스코드 계정 정보를 가져오는데 실패했습니다.');
    }
  };

  const handleDiscordLogin = () => {
    const scope = encodeURIComponent('identify');
    const authUrl = `https://discord.com/api/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`;
    
    // 현재 창에서 Discord 인증 페이지로 이동
    window.location.href = authUrl;
  };

  const checkIP = async () => {
    setStatus('checking');
    try {
      // Using ipapi.co for detailed info
      const response = await axios.get('https://ipapi.co/json/');
      const data = response.data;
      setIpInfo(data);

      // Simple region check
      if (data.country_code !== 'KR') {
        setStatus('wrong-region');
        return;
      }

      // Basic VPN detection check (heuristic)
      // Note: Professional VPN detection usually requires paid APIs like proxycheck.io
      // We check for common hosting provider keywords in the organization name
      const vpnKeywords = ['hosting', 'cloud', 'server', 'datacenter', 'vpn', 'proxy', 'digitalocean', 'google cloud', 'aws', 'amazon', 'linode', 'vultr', 'ovh'];
      const org = data.org.toLowerCase();
      const isSuspectedVPN = vpnKeywords.some(keyword => org.includes(keyword));

      if (isSuspectedVPN) {
        setStatus('vpn-detected');
      } else {
        setStatus('success');
      }
    } catch (error) {
      console.error('IP check failed', error);
      setStatus('failed');
    }
  };

  const reset = () => {
    setStatus('idle');
    setIsDiscordLoggedIn(false);
    setIpInfo(null);
    setDiscordUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-800 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl z-10"
      >
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
          <p className="text-slate-400 text-sm mt-2 text-center">
            해외 공격 차단 및 한국 사용자 인증을 위한 절차입니다.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!isDiscordLoggedIn ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 leading-relaxed">
                  1단계: 디스코드 계정 확인<br/>
                  서버 내 역할을 부여하기 위해 계정 연동이 필요합니다.
                </p>
              </div>
              <button
                onClick={handleDiscordLogin}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Discord 계정 연동하기
              </button>
            </motion.div>
          ) : status === 'idle' ? (
            <motion.div
              key="ip-check"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 leading-relaxed">
                  안녕하세요, <span className="text-blue-400 font-bold">{discordUser?.username}</span>님!<br/>
                  2단계: 거주 지역 및 네트워크 확인을 시작합니다.
                </p>
              </div>
              <button
                onClick={checkIP}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Globe className="w-5 h-5" />
                접속 위치 확인하기
              </button>
            </motion.div>
          ) : status === 'checking' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-8"
            >
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-300">네트워크 보안 검사 중...</p>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              {status === 'success' && (
                <>
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-xl font-bold text-green-500">인증 성공!</h2>
                  <p className="text-slate-400 text-sm">
                    정상적인 접속이 확인되었습니다. 서버의 멤버 역할이 부여됩니다.
                  </p>
                  <div className="bg-slate-800/50 p-3 rounded-lg text-xs text-left">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500">접속 국가:</span>
                      <span className="text-slate-200">대한민국 (KR)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">아이피:</span>
                      <span className="text-slate-200 font-mono">{ipInfo?.ip}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.close()}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition-colors mt-4"
                  >
                    창 닫고 서버로 돌아가기
                  </button>
                </>
              )}

              {status === 'wrong-region' && (
                <>
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-red-500">접속 거부</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    해외 아이피({ipInfo?.country_name}) 접속이 감지되었습니다.<br/>
                    본 서버는 보안상의 이유로 한국 아이피만 허용합니다.
                  </p>
                  <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/20 text-red-200 text-xs">
                    Access Denied: Non-KR IP detected.
                  </div>
                  <button
                    onClick={reset}
                    className="text-slate-500 text-sm hover:underline"
                  >
                    다시 시도하기
                  </button>
                </>
              )}

              {status === 'vpn-detected' && (
                <>
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                  </div>
                  <h2 className="text-xl font-bold text-amber-500">보안 위험 감지</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    VPN 또는 프록시 서버 사용이 감지되었습니다.<br/>
                    보안을 위해 VPN을 해제하고 다시 접속해주세요.
                  </p>
                  <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20 text-amber-200 text-xs text-left">
                    <p>ISP: {ipInfo?.org}</p>
                    <p className="mt-1">Detection: VPN/Hosting provider detected.</p>
                  </div>
                  <button
                    onClick={reset}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    VPN 해제 후 다시 시도
                  </button>
                </>
              )}

              {status === 'failed' && (
                <>
                  <div className="w-16 h-16 bg-slate-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-10 h-10 text-slate-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-300">오류 발생</h2>
                  <p className="text-slate-400 text-sm">
                    네트워크 정보를 가져오는데 실패했습니다.
                  </p>
                  <button
                    onClick={reset}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    다시 시도
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <footer className="mt-8 text-slate-600 text-xs flex flex-col items-center gap-2 z-10">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          <span>Powered by Anti-Raid Security System</span>
        </div>
        <p>© 2024 KR-Safe Guard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
