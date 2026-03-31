"use client";

import { useState, useCallback } from "react";
import { getSocket } from "../lib/socket";
import PlayerHand from "./PlayerHand";
import Opponent from "./Opponent";
import Market from "./Market";
import Deck from "./Deck";
import TurnIndicator from "./TurnIndicator";
import DrawnCard from "./DrawnCard";
import WalletPile from "./WalletPile";
import { Card } from "./Card";

export default function GameTable({ gameState, roomId, myId, speaking }) {
  const [throwingFromHand, setThrowingFromHand] = useState(false);
  // Index of the hand card the player has tapped to play directly (no draw needed)
  const [selectedHandIndex, setSelectedHandIndex] = useState(null);
  const socket = getSocket();

  const gs = gameState;
  const activePlayer = gs.players?.[gs.turn];
  const isMyTurn = activePlayer?.id === myId;
  const opponents = (gs.players || []).filter((p) => p.id !== myId);
  const [top, left, right] = opponents;

  const drawnCard = gs.drawnCard;
  const drawnRank = drawnCard?.rank;

  // ── Match options for drawn card ─────────────────────────────────────────
  const canMatchMarket = isMyTurn && drawnCard &&
    (gs.market || []).some((c) => c.rank === drawnRank);

  const canMatchWallets = isMyTurn && drawnCard
    ? opponents.filter((opp) => {
        const t = gs.walletTops?.[opp.id];
        return t && t.rank === drawnRank;
      }).map((opp) => ({
        playerId: opp.id,
        username: opp.username,
        topCard: gs.walletTops[opp.id],
      }))
    : [];

  // ── Match options for selected hand card ─────────────────────────────────
  // Hand-card play is only available when there is no drawn card pending and
  // the player hasn't toggled "throw from hand" mode.
  const selectedHandCard =
    selectedHandIndex !== null ? gs.myHand?.[selectedHandIndex] : null;
  const selectedRank = selectedHandCard?.rank;

  const canMatchMarketFromHand = isMyTurn && !drawnCard && selectedHandCard &&
    (gs.market || []).some((c) => c.rank === selectedRank);

  const canMatchWalletsFromHand = isMyTurn && !drawnCard && selectedHandCard
    ? opponents.filter((opp) => {
        const t = gs.walletTops?.[opp.id];
        return t && t.rank === selectedRank;
      }).map((opp) => ({
        playerId: opp.id,
        username: opp.username,
        topCard: gs.walletTops[opp.id],
      }))
    : [];

  // ── Emitters ─────────────────────────────────────────────────────────────
  const emitDraw = useCallback(() => {
    socket.emit("draw_card", { roomId });
    setThrowingFromHand(false);
    setSelectedHandIndex(null);
  }, [socket, roomId]);

  const emitMatchMarket = useCallback(() => {
    socket.emit("match_market", { roomId });
    setThrowingFromHand(false);
  }, [socket, roomId]);

  const emitMatchWallet = useCallback((targetPlayerId) => {
    socket.emit("match_wallet", { roomId, targetPlayerId });
    setThrowingFromHand(false);
  }, [socket, roomId]);

  const emitMatchMarketFromHand = useCallback(() => {
    socket.emit("match_market", { roomId, handIndex: selectedHandIndex });
    setSelectedHandIndex(null);
  }, [socket, roomId, selectedHandIndex]);

  const emitMatchWalletFromHand = useCallback((targetPlayerId) => {
    socket.emit("match_wallet", { roomId, targetPlayerId, handIndex: selectedHandIndex });
    setSelectedHandIndex(null);
  }, [socket, roomId, selectedHandIndex]);

  const emitThrowDrawn = useCallback(() => {
    socket.emit("throw_card", { roomId, cardSource: "drawn" });
    setThrowingFromHand(false);
  }, [socket, roomId]);

  const emitThrowFromHand = useCallback((handIndex) => {
    socket.emit("throw_card", { roomId, cardSource: "hand", handIndex });
    setThrowingFromHand(false);
    setSelectedHandIndex(null);
  }, [socket, roomId]);

  // ── Hand card tap handler ─────────────────────────────────────────────────
  function handleSelectHandCard(i) {
    if (!isMyTurn) return;

    // Endgame: tap = throw that card
    if (gs.phase === "endgame") {
      emitThrowFromHand(i);
      return;
    }

    // Playing phase — "throw from hand" mode (swap drawn card into hand)
    if (drawnCard && throwingFromHand) {
      emitThrowFromHand(i);
      setThrowingFromHand(false);
      return;
    }

    // Playing phase, no drawn card: select hand card for direct matching
    if (!drawnCard) {
      setSelectedHandIndex((prev) => (prev === i ? null : i));
    }
  }

  // ── Action hint ───────────────────────────────────────────────────────────
  let actionHint = null;
  if (isMyTurn) {
    if (gs.phase === "endgame") {
      if (gs.turnChaining) {
        actionHint = "Match! Tap a hand card to throw or keep playing";
      } else {
        actionHint = "Tap a hand card to throw it to market";
      }
    } else if (!drawnCard) {
      if (gs.turnChaining) {
        actionHint = "Match! Draw again or tap a hand card to play it";
      } else if (selectedHandCard) {
        if (canMatchMarketFromHand || canMatchWalletsFromHand.length > 0) {
          actionHint = "Match found! Collect or tap another card to change selection";
        } else {
          actionHint = "No matches — throw to market to end turn, or draw from deck";
        }
      } else {
        actionHint = "Draw from deck or tap a hand card to play it directly";
      }
    } else if (throwingFromHand) {
      actionHint = "Tap a hand card to throw it (drawn card goes to your hand)";
    }
  }

  function opponentSpeaking(player) {
    return !!(speaking?.[player.id]);
  }

  // Hand cards are interactive when it's your turn AND:
  //   - endgame (throw mode), OR
  //   - throwing-from-hand mode, OR
  //   - playing phase with no drawn card (direct play mode)
  const handIsInteractive =
    isMyTurn && (gs.phase === "endgame" || throwingFromHand || (!drawnCard && gs.phase === "playing"));

  return (
    <div className="flex flex-col flex-1 min-h-0 select-none h-full">
      <div className="py-2 px-4 bg-gray-900/60 border-b border-gray-800">
        <TurnIndicator players={gs.players} currentTurn={gs.turn} myId={myId} />
      </div>

      {gs.phase === "endgame" && (
        <div className="py-1.5 px-4 bg-orange-900/50 border-b border-orange-700 text-center text-xs text-orange-300 font-semibold">
          Endgame — deck empty. Play cards from your hand each turn.
        </div>
      )}

      <div className="flex flex-col flex-1 items-center justify-between p-2 sm:p-3 gap-2 sm:gap-3 overflow-auto">

        {/* ── Mobile: compact opponent strip (hidden on sm+) ── */}
        <div className="sm:hidden flex justify-around items-start w-full gap-1">
          {[top, left, right].filter(Boolean).map((opp) => (
            <Opponent
              key={opp.id}
              compact
              player={opp}
              cardCount={gs.opponentCardCounts?.[opp.id] ?? 0}
              walletTop={gs.walletTops?.[opp.id]}
              walletSize={gs.opponentWalletSizes?.[opp.id] ?? 0}
              lockedCount={gs.lockedSetCounts?.[opp.id] ?? 0}
              isActive={activePlayer?.id === opp.id}
              canSteal={
                !!(canMatchWallets.find((m) => m.playerId === opp.id)) ||
                !!(canMatchWalletsFromHand.find((m) => m.playerId === opp.id))
              }
              onStealWallet={() =>
                canMatchWallets.find((m) => m.playerId === opp.id)
                  ? emitMatchWallet(opp.id)
                  : emitMatchWalletFromHand(opp.id)
              }
              isSpeaking={opponentSpeaking(opp)}
            />
          ))}
          {opponents.length === 0 && (
            <div className="text-gray-700 text-xs">Waiting…</div>
          )}
        </div>

        {/* ── Desktop: top opponent (hidden on mobile) ── */}
        <div className="hidden sm:flex justify-center w-full">
          {top ? (
            <Opponent
              player={top}
              cardCount={gs.opponentCardCounts?.[top.id] ?? 0}
              walletTop={gs.walletTops?.[top.id]}
              walletSize={gs.opponentWalletSizes?.[top.id] ?? 0}
              lockedCount={gs.lockedSetCounts?.[top.id] ?? 0}
              isActive={activePlayer?.id === top.id}
              canSteal={
                !!(canMatchWallets.find((m) => m.playerId === top.id)) ||
                !!(canMatchWalletsFromHand.find((m) => m.playerId === top.id))
              }
              onStealWallet={() =>
                canMatchWallets.find((m) => m.playerId === top.id)
                  ? emitMatchWallet(top.id)
                  : emitMatchWalletFromHand(top.id)
              }
              isSpeaking={opponentSpeaking(top)}
            />
          ) : (
            <div className="h-20 flex items-center text-gray-700 text-sm">Waiting…</div>
          )}
        </div>

        {/* ── Middle row: left(desktop) + center + right(desktop) ── */}
        <div className="flex items-center justify-between w-full max-w-3xl gap-2">
          {/* Left opponent — desktop only */}
          <div className="hidden sm:block flex-shrink-0">
            {left && (
              <Opponent
                player={left}
                cardCount={gs.opponentCardCounts?.[left.id] ?? 0}
                walletTop={gs.walletTops?.[left.id]}
                walletSize={gs.opponentWalletSizes?.[left.id] ?? 0}
                lockedCount={gs.lockedSetCounts?.[left.id] ?? 0}
                isActive={activePlayer?.id === left.id}
                canSteal={
                  !!(canMatchWallets.find((m) => m.playerId === left.id)) ||
                  !!(canMatchWalletsFromHand.find((m) => m.playerId === left.id))
                }
                onStealWallet={() =>
                  canMatchWallets.find((m) => m.playerId === left.id)
                    ? emitMatchWallet(left.id)
                    : emitMatchWalletFromHand(left.id)
                }
                isSpeaking={opponentSpeaking(left)}
              />
            )}
          </div>

          {/* Center: market + deck + wallet */}
          <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
            <Market
              cards={gs.market}
              drawnCardRank={selectedHandCard ? selectedRank : drawnRank}
              highlightMatches={
                isMyTurn &&
                !throwingFromHand &&
                ((!!drawnCard) || (!!selectedHandCard && !drawnCard))
              }
            />
            <div className="flex items-end gap-3 sm:gap-6">
              <Deck
                count={gs.deckCount ?? 0}
                onDraw={emitDraw}
                isMyTurn={isMyTurn && !drawnCard && gs.phase === "playing" && !selectedHandCard}
              />
              <WalletPile
                topCard={gs.walletTops?.[myId]}
                size={gs.myWalletSize ?? (gs.myWallet?.length ?? 0)}
                lockedCount={gs.lockedSetCounts?.[myId] ?? 0}
                label="my wallet"
              />
            </div>
            {actionHint && (
              <p className="text-xs text-yellow-400 animate-pulse text-center max-w-[260px] sm:max-w-xs">
                {actionHint}
              </p>
            )}
          </div>

          {/* Right opponent — desktop only */}
          <div className="hidden sm:block flex-shrink-0">
            {right && (
              <Opponent
                player={right}
                cardCount={gs.opponentCardCounts?.[right.id] ?? 0}
                walletTop={gs.walletTops?.[right.id]}
                walletSize={gs.opponentWalletSizes?.[right.id] ?? 0}
                lockedCount={gs.lockedSetCounts?.[right.id] ?? 0}
                isActive={activePlayer?.id === right.id}
                canSteal={
                  !!(canMatchWallets.find((m) => m.playerId === right.id)) ||
                  !!(canMatchWalletsFromHand.find((m) => m.playerId === right.id))
                }
                onStealWallet={() =>
                  canMatchWallets.find((m) => m.playerId === right.id)
                    ? emitMatchWallet(right.id)
                    : emitMatchWalletFromHand(right.id)
                }
                isSpeaking={opponentSpeaking(right)}
              />
            )}
          </div>
        </div>

        {/* Bottom: action panels + hand */}
        <div className="w-full flex flex-col items-center gap-2 sm:gap-3">

          {/* Drawn card action panel */}
          {isMyTurn && drawnCard && !throwingFromHand && (
            <DrawnCard
              drawnCard={drawnCard}
              canMatchMarket={canMatchMarket}
              canMatchWallets={canMatchWallets}
              onMatchMarket={emitMatchMarket}
              onMatchWallet={emitMatchWallet}
              onThrowDrawn={emitThrowDrawn}
              onThrowFromHand={() => setThrowingFromHand(true)}
            />
          )}

          {/* Selected hand card action panel (direct play — no draw needed) */}
          {isMyTurn && !drawnCard && selectedHandCard && !throwingFromHand && (
            <div className="flex flex-col items-center gap-2 sm:gap-3 bg-gray-800/80 border border-blue-400/40 rounded-2xl p-3 sm:p-4 w-full max-w-xs">
              <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold">
                Playing from hand
              </p>

              <Card card={selectedHandCard} selected />

              <div className="flex flex-col items-center gap-2 w-full">
                {canMatchMarketFromHand && (
                  <button
                    onClick={emitMatchMarketFromHand}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-xl text-sm transition"
                  >
                    ✅ Match market — collect cards
                  </button>
                )}

                {canMatchWalletsFromHand.map(({ playerId, username, topCard }) => (
                  <button
                    key={playerId}
                    onClick={() => emitMatchWalletFromHand(playerId)}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-xl text-sm transition"
                  >
                    🎯 Steal from {username}'s wallet ({topCard.rank}{topCard.suit})
                  </button>
                ))}

                {!canMatchMarketFromHand && canMatchWalletsFromHand.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No matches — throw to market or draw from deck</p>
                )}

                <button
                  onClick={() => emitThrowFromHand(selectedHandIndex)}
                  className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded-xl text-sm transition"
                >
                  🗑️ Throw to market — end turn
                </button>

                <button
                  onClick={() => setSelectedHandIndex(null)}
                  className="w-full bg-transparent hover:bg-gray-700/50 border border-gray-700 text-gray-400 font-medium py-1.5 rounded-xl text-xs transition"
                >
                  Cancel — deselect card
                </button>
              </div>
            </div>
          )}

          <PlayerHand
            hand={gs.myHand}
            selectedIndex={selectedHandIndex}
            onSelectCard={handleSelectHandCard}
            isMyTurn={handIsInteractive}
            phase={gs.phase}
            throwingFromHand={throwingFromHand}
          />
        </div>
      </div>

      {gs.lastAction && (
        <div className="py-2 px-4 bg-gray-900/60 border-t border-gray-800 text-center text-xs text-gray-400">
          <ActionLog action={gs.lastAction} />
        </div>
      )}
    </div>
  );
}

function ActionLog({ action }) {
  if (!action) return null;
  const name = <span className="text-white">{action.player?.username}</span>;
  const card = (c) => c ? <span className="text-yellow-400">{c.rank}{c.suit}</span> : null;
  const source = action.fromHand ? " (hand card)" : "";
  switch (action.type) {
    case "draw":         return <>{name} drew a card</>;
    case "match_market": return <>{name} matched and collected {action.collected?.length} card(s) from market{source}</>;
    case "match_wallet": return <>{name} stole {action.collected?.length} card(s) from {action.targetPlayer?.username}'s wallet{source}</>;
    case "throw":        return <>{name} threw {card(action.card)} to market — turn ends</>;
    case "phase_change": return <span className="text-orange-400">{action.message}</span>;
    default:             return null;
  }
}
