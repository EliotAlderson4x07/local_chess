import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PieceSkinId, PlayerProfile } from '../types/chess.ts';
import { PIECE_SKIN_THEMES, PieceSvg } from '../constants/pieces.tsx';
import { soundService } from '../services/audio.ts';

interface PremiumCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile;
  onSuccess: (updatedPlayer: PlayerProfile) => void;
  initialReason?: string; // e.g. "Para invocar 10 reinas..."
}

type PaymentMethod = 'card' | 'paypal' | 'wallet' | 'bizum' | 'crypto';
type PlanTier = 'monthly' | 'yearly' | 'lifetime';

export const PremiumCheckoutModal: React.FC<PremiumCheckoutModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
  initialReason
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedSkin, setSelectedSkin] = useState<PieceSkinId>(
    player.activePieceSkin || 'royal_gold'
  );

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(player.nickname || 'Maestro del Ajedrez');

  // Alternative payment inputs
  const [bizumPhone, setBizumPhone] = useState('+34 600 000 000');
  const [paypalEmail, setPaypalEmail] = useState(player.email || 'jugador@chessmaster.com');
  const [cryptoCoin, setCryptoCoin] = useState<'USDT' | 'BTC' | 'ETH'>('USDT');

  // Promo code
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Flow status
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStepText, setProcessStepText] = useState('');
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  if (!isOpen) return null;

  // Plan pricing
  const planDetails: Record<PlanTier, { name: string; price: number; billing: string; badge?: string }> = {
    monthly: { name: 'Plan Mensual', price: 4.99, billing: '/mes' },
    yearly: { name: 'Plan Anual VIP', price: 29.99, billing: '/año (Ahorras 50%)', badge: 'MÁS POPULAR' },
    lifetime: { name: 'Pase Dios Vitalicio', price: 49.99, billing: 'Pago Único de por vida', badge: 'RECOMENDADO' }
  };

  const activePlan = planDetails[selectedPlan];
  const finalPrice = discountPercent > 0
    ? (activePlan.price * (1 - discountPercent / 100)).toFixed(2)
    : activePlan.price.toFixed(2);

  // Card formatting helpers
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('888');
    setCardName(player.nickname || 'Gran Maestro');
  };

  const applyPromo = () => {
    const clean = promoCode.trim().toUpperCase();
    if (clean === 'VIPFREE' || clean === 'CHESS100' || clean === 'GODMODE') {
      setDiscountPercent(100);
      setPromoMessage('🎉 ¡Cupón aplicado! 100% de descuento VIP gratuito.');
    } else if (clean === 'VIP50' || clean === 'CHESS2026') {
      setDiscountPercent(50);
      setPromoMessage('✨ ¡Cupón aplicado! 50% de descuento especial.');
    } else {
      setPromoMessage('❌ Cupón no válido. Prueba con VIPFREE o CHESS2026.');
    }
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessStepText('Conectando con pasarela segura de pago con cifrado bancario SSL de 256 bits...');

    setTimeout(() => {
      setProcessStepText('Verificando autorización y asignando licencia VIP ChessMaster...');
    }, 600);

    setTimeout(() => {
      setIsProcessing(false);
      setPurchaseComplete(true);
      soundService.playPurchaseSuccess();

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 }
      });

      const updated: PlayerProfile = {
        ...player,
        isPremium: true,
        premiumTier: selectedPlan,
        activePieceSkin: selectedSkin
      };

      onSuccess(updated);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#262421] border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-white my-auto animate-fadeIn max-h-[92vh] flex flex-col">
        {/* VIP Top Header Gradient Banner */}
        <div className="relative bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 px-6 py-5 text-zinc-950 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow">👑</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  PLAN PREMIUM & PODERES VIP
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black text-amber-300">
                  CHESSMASTER PRO
                </span>
              </div>
              <p className="text-xs font-bold text-amber-950/80">
                {initialReason || 'Desbloquea Skins exclusivas para cada color y Poderes Supremos en tus partidas.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 text-zinc-900 font-black text-lg flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {purchaseComplete ? (
            /* Success Screen */
            <div className="py-8 text-center flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center text-4xl shadow-xl animate-bounce">
                👑
              </div>
              <h3 className="text-2xl font-black text-amber-300">
                ¡BIENVENIDO AL CLUB VIP CHESSMASTER!
              </h3>
              <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                Tu cuenta ha sido ascendida con éxito a <strong>Plan Premium</strong>. Ya tienes desbloqueados los superpoderes en partida y el catálogo completo de skins adaptadas.
              </p>

              <div className="bg-[#312e2b] border border-amber-500/30 rounded-2xl p-4 max-w-md w-full text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Plan Activado:</span>
                  <span className="font-extrabold text-amber-400 uppercase">{selectedPlan}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Skin Activa:</span>
                  <span className="font-extrabold text-white">
                    {PIECE_SKIN_THEMES[selectedSkin].name} ({PIECE_SKIN_THEMES[selectedSkin].icon})
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Superpoderes en Partida:</span>
                  <span className="font-bold text-emerald-400">10 Reinas & Aniquilación de Pieza Activados</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black text-sm rounded-2xl shadow-xl transition cursor-pointer"
              >
                ¡Ir a Jugar con mis Nuevos Poderes! 🚀
              </button>
            </div>
          ) : (
            <>
              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#312e2b] border border-amber-500/20 p-2.5 rounded-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs">
                    <span>👑</span>
                    <span className="truncate">10 Reinas VIP</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug">
                    Invoca un ejército de hasta 10 damas en mitad de tu partida.
                  </p>
                </div>

                <div className="bg-[#312e2b] border border-amber-500/20 p-2.5 rounded-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-red-400 font-extrabold text-xs">
                    <span>⚡</span>
                    <span className="truncate">Aniquilar Ficha</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug">
                    Rayo destructor para vaporizar piezas rivales con un solo clic.
                  </p>
                </div>

                <div className="bg-[#312e2b] border border-amber-500/20 p-2.5 rounded-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs">
                    <span>✨</span>
                    <span className="truncate">Revivir Aliadas</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug">
                    Resucita damas, torres y piezas caídas en cualquier casilla libre.
                  </p>
                </div>

                <div className="bg-[#312e2b] border border-amber-500/20 p-2.5 rounded-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-orange-400 font-extrabold text-xs">
                    <span>☢️</span>
                    <span className="truncate">Nuke Tablas</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug">
                    Detona una bomba que solo perdona a los Reyes y fuerza Tablas.
                  </p>
                </div>
              </div>

              {/* 1. PLAN SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <span>1.</span> Selecciona tu Modalidad de Suscripción
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(planDetails) as PlanTier[]).map(tierKey => {
                    const tier = planDetails[tierKey];
                    const isSelected = selectedPlan === tierKey;
                    return (
                      <div
                        key={tierKey}
                        onClick={() => setSelectedPlan(tierKey)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 shadow-md'
                            : 'bg-[#312e2b] border-[#3f3c38] hover:border-gray-500'
                        }`}
                      >
                        {tier.badge && (
                          <span className="absolute -top-2.5 right-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 shadow">
                            {tier.badge}
                          </span>
                        )}
                        <div>
                          <span className="text-xs font-extrabold text-white block">{tier.name}</span>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-xl font-black text-amber-400">${tier.price}</span>
                            <span className="text-[10px] text-gray-400">{tier.billing}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. CHOOSE INITIAL SKINS WITH DUAL COLOR PREVIEW */}
              <div className="space-y-2 bg-[#312e2b] p-4 rounded-2xl border border-[#3f3c38]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <span>2.</span> Catálogo de Skins para tus Fichas (Adaptadas para Blancas y Negras)
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold">Incluidas en tu Pase VIP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {(Object.keys(PIECE_SKIN_THEMES) as PieceSkinId[]).map(skinId => {
                    const skinTheme = PIECE_SKIN_THEMES[skinId];
                    const isSelected = selectedSkin === skinId;
                    return (
                      <div
                        key={skinId}
                        onClick={() => setSelectedSkin(skinId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-[#262421] border-amber-500 ring-2 ring-amber-500/30 shadow'
                            : 'bg-[#262421]/60 border-[#3f3c38] hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-white flex items-center gap-1">
                            <span>{skinTheme.icon}</span> {skinTheme.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-amber-400 font-black">✓ Activa</span>
                          )}
                        </div>

                        {/* Dual Color Pieces Preview (White vs Black) */}
                        <div className="grid grid-cols-2 gap-2 bg-[#1b1917] p-2 rounded-lg border border-[#3f3c38]/50">
                          {/* White piece preview */}
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className="w-8 h-8 shrink-0">
                              <PieceSvg type="q" color="w" skin={skinId} />
                            </div>
                            <div className="truncate">
                              <span className="text-[9px] text-gray-400 block uppercase font-bold leading-none">
                                Blancas
                              </span>
                              <span className="text-[10px] font-semibold text-gray-200 truncate block">
                                {skinTheme.whiteColorName}
                              </span>
                            </div>
                          </div>

                          {/* Black piece preview */}
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <div className="w-8 h-8 shrink-0">
                              <PieceSvg type="q" color="b" skin={skinId} />
                            </div>
                            <div className="truncate">
                              <span className="text-[9px] text-gray-400 block uppercase font-bold leading-none">
                                Negras
                              </span>
                              <span className="text-[10px] font-semibold text-gray-200 truncate block">
                                {skinTheme.blackColorName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] text-gray-400 italic truncate">
                          {skinTheme.tagline}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. PAYMENT METHOD SELECTOR TABS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <span>3.</span> Selecciona Método de Pago
                  </label>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span>🔒</span> Cifrado Bancario SSL 256-Bit
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#1c1a18] rounded-2xl border border-[#3f3c38]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-1 rounded-xl font-bold text-[11px] transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>💳</span> <span>Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`py-2 px-1 rounded-xl font-bold text-[11px] transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>🅿️</span> <span>PayPal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`py-2 px-1 rounded-xl font-bold text-[11px] transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'wallet'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>📱</span> <span>G-Pay / Apple</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bizum')}
                    className={`py-2 px-1 rounded-xl font-bold text-[11px] transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'bizum'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>⚡</span> <span>Bizum / MP</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`py-2 px-1 rounded-xl font-bold text-[11px] transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === 'crypto'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>🪙</span> <span>Cripto</span>
                  </button>
                </div>

                {/* FORM SPECIFIC TO PAYMENT METHOD */}
                <form onSubmit={handleExecutePayment} className="space-y-4">
                  {/* Option A: Credit / Debit Card */}
                  {paymentMethod === 'card' && (
                    <div className="bg-[#312e2b] p-4 rounded-2xl border border-[#3f3c38] space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] font-bold text-gray-300">
                          Visa, Mastercard, American Express
                        </span>
                        <button
                          type="button"
                          onClick={fillTestCard}
                          className="text-[10px] text-amber-400 hover:underline font-bold"
                        >
                          ⚡ Autocompletar Tarjeta de Prueba
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                          Número de Tarjeta
                        </label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={e => handleCardNumberChange(e.target.value)}
                          placeholder="4242 •••• •••• 4242"
                          maxLength={19}
                          className="w-full bg-[#262421] text-white text-xs sm:text-sm font-mono py-2.5 px-3 rounded-xl border border-[#3f3c38] focus:border-amber-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                            Vencimiento (MM/AA)
                          </label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={e => handleExpiryChange(e.target.value)}
                            placeholder="MM/AA"
                            maxLength={5}
                            className="w-full bg-[#262421] text-white text-xs sm:text-sm font-mono py-2.5 px-3 rounded-xl border border-[#3f3c38] focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                            CVC / CVV
                          </label>
                          <input
                            type="password"
                            required
                            value={cardCvc}
                            onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full bg-[#262421] text-white text-xs sm:text-sm font-mono py-2.5 px-3 rounded-xl border border-[#3f3c38] focus:border-amber-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                          Nombre del Titular
                        </label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          placeholder="Nombre y Apellidos"
                          className="w-full bg-[#262421] text-white text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-[#3f3c38] focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Option B: PayPal */}
                  {paymentMethod === 'paypal' && (
                    <div className="bg-[#312e2b] p-4 rounded-2xl border border-[#3f3c38] space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🅿️</span>
                        <div>
                          <span className="font-bold text-xs text-white block">
                            Checkout Instantáneo con PayPal
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Paga con saldo de PayPal o tus cuentas bancarias vinculadas.
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                          Correo electrónico de PayPal
                        </label>
                        <input
                          type="email"
                          required
                          value={paypalEmail}
                          onChange={e => setPaypalEmail(e.target.value)}
                          className="w-full bg-[#262421] text-white text-xs sm:text-sm py-2.5 px-3 rounded-xl border border-[#3f3c38] focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Option C: Google Pay / Apple Pay */}
                  {paymentMethod === 'wallet' && (
                    <div className="bg-[#312e2b] p-4 rounded-2xl border border-[#3f3c38] space-y-3 text-center">
                      <span className="text-3xl block">📱</span>
                      <h4 className="font-extrabold text-sm text-white">
                        Pago Rápido con 1 Clic (Biometría / FaceID)
                      </h4>
                      <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                        Se utilizará la tarjeta preferida de tu cuenta de Google Pay o Apple Wallet con autenticación en dispositivo.
                      </p>
                    </div>
                  )}

                  {/* Option D: Bizum / MercadoPago */}
                  {paymentMethod === 'bizum' && (
                    <div className="bg-[#312e2b] p-4 rounded-2xl border border-[#3f3c38] space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        <div>
                          <span className="font-bold text-xs text-white block">
                            Bizum / MercadoPago / Transferencia Inmediata
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Recibirás una solicitud push en la app de tu banco.
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-400 block mb-1">
                          Número de teléfono móvil asociado
                        </label>
                        <input
                          type="tel"
                          required
                          value={bizumPhone}
                          onChange={e => setBizumPhone(e.target.value)}
                          className="w-full bg-[#262421] text-white text-xs sm:text-sm font-mono py-2.5 px-3 rounded-xl border border-[#3f3c38] focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Option E: Crypto */}
                  {paymentMethod === 'crypto' && (
                    <div className="bg-[#312e2b] p-4 rounded-2xl border border-[#3f3c38] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🪙</span> Pago Descentralizado Cripto
                        </span>
                        <div className="flex gap-1">
                          {(['USDT', 'BTC', 'ETH'] as const).map(coin => (
                            <button
                              type="button"
                              key={coin}
                              onClick={() => setCryptoCoin(coin)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cryptoCoin === coin ? 'bg-amber-500 text-zinc-950' : 'bg-[#262421] text-gray-400'
                              }`}
                            >
                              {coin}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#1f1d1b] rounded-xl border border-[#3f3c38] font-mono text-[10px] text-gray-300 break-all select-all flex items-center justify-between">
                        <span>0x710b...vip_chessmaster_treasury_{cryptoCoin.toLowerCase()}</span>
                        <span className="text-amber-400 font-bold ml-2">Copiar</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        Confirmación instantánea en red TRC20 / ERC20.
                      </span>
                    </div>
                  )}

                  {/* Promo Code Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      placeholder="¿Tienes cupón de descuento? (Prueba VIPFREE)"
                      className="flex-1 bg-[#1c1a18] text-white text-xs py-2 px-3 rounded-xl border border-[#3f3c38] focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyPromo}
                      className="px-3.5 py-2 bg-[#312e2b] hover:bg-[#3f3c38] text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-[11px] font-semibold ${discountPercent > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {promoMessage}
                    </p>
                  )}

                  {/* Total & Submit Button */}
                  <div className="pt-2 border-t border-[#3f3c38] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Total a Pagar:</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-amber-400">${finalPrice}</span>
                        {discountPercent > 0 && (
                          <span className="text-xs line-through text-gray-500">
                            ${activePlan.price}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 uppercase font-bold">USD</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-zinc-950 font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      {isProcessing ? (
                        <>
                          <span className="animate-spin text-base">⏳</span>
                          <span>Procesando pago seguro...</span>
                        </>
                      ) : (
                        <>
                          <span>👑</span>
                          <span>Confirmar Pago y Desbloquear VIP</span>
                        </>
                      )}
                    </button>
                  </div>

                  {isProcessing && (
                    <p className="text-[11px] text-amber-300 text-center animate-pulse pt-1">
                      {processStepText}
                    </p>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
