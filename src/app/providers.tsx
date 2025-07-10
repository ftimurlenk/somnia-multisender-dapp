'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { somniaTestnet } from './SomniaChain';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
// İstenen tüm spesifik konektörleri wagmi'den import ediyoruz
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [somniaTestnet],
  connectors: [
    // Belirttiğiniz cüzdanlar için spesifik konektörler.
    // ConnectKit, bunları algıladığında genellikle özel ikon ve isimle gösterir.
    metaMask(),
    coinbaseWallet({
      appName: 'Somnia STT Multisender',
    }),
   
    injected(),
  ],
  transports: {
    [somniaTestnet.id]: http(),
  },
  pollingInterval: 4000,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}