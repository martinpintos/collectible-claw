"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Money } from "@/components/ui/Money";
import { RadioCard } from "@/components/ui/RadioCard";
import { Segmented } from "@/components/ui/Segmented";
import { useHaptics } from "@/hooks/use-haptics";
import { money } from "@/lib/domain/format";
import { priceFor } from "@/lib/domain/pricing";
import type { Machine, PaymentMethod, Promo, WalletChoice, WalletSnapshot } from "@/lib/domain/types";
import { EXTERNAL_WALLET_BALANCE } from "@/lib/domain/wallet";
import type { FlowEvent } from "@/store/claw-flow";

interface PaymentModalProps {
  machine: Machine;
  wallet: WalletSnapshot;
  quantity: number;
  promo: Promo | null;
  paymentMethod: PaymentMethod;
  walletChoice: WalletChoice;
  error: string | null;
  pending: boolean;
  onConfirm: () => void;
  dispatch: (event: FlowEvent) => void;
}

export function PaymentModal({
  machine,
  wallet,
  quantity,
  promo,
  paymentMethod,
  walletChoice,
  error,
  pending,
  onConfirm,
  dispatch,
}: PaymentModalProps) {
  const haptics = useHaptics();
  const quote = priceFor(machine, quantity, promo);
  const [touched, setTouched] = useState(false);
  const insufficient = paymentMethod === "wallet" && walletChoice === "beezie" && wallet.balance < quote.total;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-fg">Review &amp; pay</h2>
        <IconButton label="Close" onClick={() => dispatch({ type: "CLOSE" })} disabled={pending}>
          <X className="size-5" />
        </IconButton>
      </div>

      <Segmented
        label="Payment method"
        value={paymentMethod}
        options={[
          { value: "wallet", label: "Wallet" },
          { value: "card", label: "Credit / Debit" },
        ]}
        onChange={(method) => {
          haptics.fire("select");
          dispatch({ type: "SET_PAYMENT_METHOD", method });
        }}
      />

      <section aria-label="Summary" className="space-y-2">
        <h3 className="text-sm font-semibold text-fg">Summary</h3>
        <div className="flex items-center gap-3 rounded-control border border-border bg-control p-3">
          <Image
            src={machine.media.poster}
            alt=""
            width={44}
            height={44}
            className="size-11 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{machine.name}</p>
            <p className="text-xs text-fg-secondary">Quantity: {quantity}</p>
          </div>
          <div className="text-right">
            <Money value={quote.total} className="block text-base font-semibold text-fg" />
            <span className="text-xs font-medium text-brand">+{quote.points} pts</span>
          </div>
        </div>
        {promo ? (
          <p className="flex justify-between px-1 text-xs text-fg-secondary">
            <span>
              Promo <span className="font-semibold text-brand">{promo.code}</span> ({promo.discountPct}% off)
            </span>
            <span>−{money(quote.discount, { cents: true })}</span>
          </p>
        ) : null}
      </section>

      <AnimatePresence initial={false} mode="wait">
        {paymentMethod === "wallet" ? (
          <motion.section
            key="wallet"
            aria-label="Choose wallet"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-2"
          >
            <h3 className="text-sm font-semibold text-fg">Choose Wallet</h3>
            <div className="grid grid-cols-2 gap-2">
              <RadioCard
                name="wallet"
                checked={walletChoice === "beezie"}
                onSelect={() => {
                  haptics.fire("select");
                  dispatch({ type: "SET_WALLET", wallet: "beezie" });
                }}
                title="Beezie wallet"
                description={money(wallet.balance)}
              />
              <RadioCard
                name="wallet"
                checked={walletChoice === "external"}
                onSelect={() => {
                  haptics.fire("select");
                  dispatch({ type: "SET_WALLET", wallet: "external" });
                }}
                title="External wallet"
                description={money(EXTERNAL_WALLET_BALANCE)}
              />
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="card"
            aria-label="Card payment"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex h-32 items-center justify-center rounded-control border border-dashed border-border text-sm text-fg-secondary"
          >
            Coinflow widget
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {error || (touched && insufficient) ? (
          <motion.p
            key={error ?? "insufficient-funds"}
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="rounded-input bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error ?? "Not enough balance in your Beezie wallet."}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Button
        size="lg"
        fullWidth
        glow
        pending={pending}
        onClick={() => {
          setTouched(true);
          if (insufficient) {
            haptics.fire("error");
            return;
          }
          onConfirm();
        }}
      >
        Confirm
      </Button>
    </div>
  );
}
