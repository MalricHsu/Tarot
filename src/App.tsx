import { RotateCcw, Sparkles, WandSparkles } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { cardBackImage } from './data/tarot';
import { buildInterpretation, drawThreeCards } from './logic/spread';
import type { DrawnCard, ReadingResult } from './types';

function App() {
  const [question, setQuestion] = useState('');
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState(false);

  const reading: ReadingResult | null = useMemo(() => {
    if (drawnCards.length !== 3) return null;
    return buildInterpretation(question, drawnCards);
  }, [drawnCards, question]);

  const canDraw = question.trim().length > 0;
  const showError = hasTriedSubmit && !canDraw;

  const performDraw = () => {
    setHasTriedSubmit(true);

    if (!canDraw) return;

    setDrawnCards(drawThreeCards());
    setRevealed(false);
    window.setTimeout(() => setRevealed(true), 120);
  };

  const handleDraw = (event: FormEvent) => {
    event.preventDefault();
    performDraw();
  };

  const resetDraw = () => {
    if (!canDraw) return;
    setDrawnCards(drawThreeCards());
    setRevealed(false);
    window.setTimeout(() => setRevealed(true), 120);
  };

  const editQuestion = () => {
    setDrawnCards([]);
    setRevealed(false);
  };

  return (
    <main className="app-shell">
      <section className="app-panel" aria-labelledby="app-title">
        <header className="app-header">
          <div>
            <p className="eyebrow">三張牌問答</p>
            <h1 id="app-title">塔羅問答</h1>
          </div>
          <div className="moon-mark" aria-hidden="true">
            <Sparkles size={24} />
          </div>
        </header>

        <form className="question-form" onSubmit={handleDraw}>
          <label htmlFor="question">你的問題</label>
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="例如：我該如何面對目前的工作選擇？"
            rows={4}
            disabled={drawnCards.length > 0}
          />
          {showError ? <p className="field-error">請先輸入一個想反思的問題。</p> : null}

          {drawnCards.length === 0 ? (
            <button className="primary-action" type="submit" disabled={!canDraw}>
              <WandSparkles size={18} />
              抽三張牌
            </button>
          ) : (
            <div className="action-row">
              <button className="secondary-action" type="button" onClick={editQuestion}>
                修改問題
              </button>
              <button className="primary-action compact" type="button" onClick={resetDraw}>
                <RotateCcw size={18} />
                重新抽牌
              </button>
            </div>
          )}
        </form>

        <section className="deck-area" aria-label="塔羅牌區">
          {drawnCards.length === 0 ? (
            <button className="deck-stack" type="button" onClick={performDraw} disabled={!canDraw}>
              <img src={cardBackImage} alt="" />
              <span>點擊牌背抽牌</span>
            </button>
          ) : (
            <div className="reading-grid">
              {drawnCards.map((draw, index) => (
                <article className={`reading-card ${revealed ? 'is-revealed' : ''}`} key={`${draw.position.id}-${draw.card.id}`}>
                  <div className="card-visual-wrap">
                    <img
                      className={draw.orientation === 'reversed' ? 'card-visual reversed' : 'card-visual'}
                      src={draw.card.image}
                      alt={`${draw.card.nameZh} ${draw.orientation === 'upright' ? '正位' : '逆位'}`}
                    />
                  </div>
                  <div className="card-copy">
                    <p className="position">{index + 1}. {draw.position.label}</p>
                    <h2>{draw.card.nameZh}</h2>
                    <p className={draw.orientation === 'reversed' ? 'orientation reversed-text' : 'orientation'}>
                      {draw.orientation === 'upright' ? '正位' : '逆位'}
                    </p>
                    <p>{reading?.interpretations[index]}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {reading ? (
          <aside className="summary" aria-label="總結建議">
            <h2>總結建議</h2>
            <p>{reading.summary}</p>
          </aside>
        ) : null}
      </section>
    </main>
  );
}

export default App;
