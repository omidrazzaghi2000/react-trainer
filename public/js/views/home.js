import { t, L, num } from '../i18n.js';
import { store } from '../store.js';
import { esc, icon, rich, tx } from '../util.js';

const LOOP_ICONS = ['book-open', 'network', 'play', 'list-checks', 'puzzle'];

export function render(ctx) {
  const { root, meta, lessons, categories, catById } = ctx;
  ctx.setTitle('');
  const s = store.get();
  const learned = lessons.filter((l) => s.learned[l.id]).length;
  const next = lessons.find((l) => !s.learned[l.id]);
  const started = learned > 0 || Object.keys(s.quiz).length > 0;
  const [before, after] = t('home.title').split('{hl}');

  const statTiles = [
    { tone: 'teal', icon: 'blocks', value: meta.lessonCount, label: t('home.stats.lessons') },
    { tone: 'violet', icon: 'list-checks', value: meta.questionCount, label: t('home.stats.questions') },
    { tone: 'blue', icon: 'flask-conical', value: meta.testCount, label: t('home.stats.challenges') },
    { tone: 'amber', icon: 'graduation-cap', value: learned, label: t('home.stats.learned') },
  ];

  const nextCat = next ? catById.get(next.category) : null;

  root.innerHTML = `
    <section class="hero block" aria-labelledby="hero-title">
      <div class="hero-copy">
        <span class="chip chip--light">${icon('sparkles')}${tx('home.eyebrow', { n: lessons.length })}</span>
        <h1 class="hero-title" id="hero-title">${rich(before)}<span class="hl">${tx('home.titleHl')}</span>${rich(after || '')}</h1>
        <p class="hero-sub">${tx('home.sub')}</p>
        <div class="hero-cta">
          <a class="btn btn--accent btn--lg" href="#/l/${esc((next || lessons[0]).id)}">${icon('play')}${esc(t(started ? 'home.continue' : 'home.start'))}</a>
          <a class="btn btn--light btn--lg" href="#/training">${icon('dumbbell')}${esc(t('home.train'))}</a>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <span class="shape s1"></span><span class="shape s2"></span><span class="shape s3"></span><span class="shape s4"></span>
        <span class="atom-orbit"><svg viewBox="0 0 120 120"><g fill="none" stroke="currentColor" stroke-width="5"><ellipse cx="60" cy="60" rx="52" ry="20"/><ellipse cx="60" cy="60" rx="52" ry="20" transform="rotate(60 60 60)"/><ellipse cx="60" cy="60" rx="52" ry="20" transform="rotate(120 60 60)"/></g><circle cx="60" cy="60" r="10" fill="currentColor"/></svg></span>
        <div class="code-card" dir="ltr">
          <div class="dots"><span></span><span></span><span></span></div>
<pre><span class="tok-k">function</span> <span class="tok-f">You</span>() {
  <span class="tok-k">const</span> [lvl, setLvl] =
    <span class="tok-f">useState</span>(<span class="tok-s">'beginner'</span>);
  <span class="tok-k">return</span> <span class="tok-t">&lt;Trainer</span>
    <span class="tok-a">onDone</span>={() =&gt;
      <span class="tok-f">setLvl</span>(<span class="tok-s">'elite'</span>)}
  <span class="tok-t">/&gt;</span>;
}</pre>
        </div>
      </div>
    </section>

    <div class="stats-row">
      ${statTiles.map((st) => `<div class="clay stat tone-${st.tone}">
        <span class="stat-icon">${icon(st.icon)}</span>
        <span class="stat-value">${num(st.value)}</span>
        <span class="stat-label">${esc(st.label)}</span>
      </div>`).join('')}
    </div>

    ${started ? `<section class="section" aria-labelledby="next-title">
      ${next ? `<a class="block continue-block" data-cat="${esc(next.category)}" href="#/l/${esc(next.id)}" style="text-decoration:none">
        <span class="big-icon">${icon(next.icon)}</span>
        <div>
          <span class="chip chip--light">${icon('route')}${esc(t('home.upNext'))} · ${esc(L(nextCat.name))}</span>
          <h3 id="next-title" style="margin-top:12px">${rich(L(next.name))}</h3>
          <p>${rich(L(next.tagline))}</p>
        </div>
        <span class="btn btn--light">${esc(t('home.continue'))}${icon('arrow-right', 'flip-rtl')}</span>
      </a>` : `<div class="block block--green continue-block"><span class="big-icon" style="color:var(--color-success)">${icon('trophy')}</span><div><h3 id="next-title">${tx('home.allDone')}</h3></div><a class="btn btn--light" href="#/training">${esc(t('home.train'))}</a></div>`}
    </section>` : ''}

    <section class="section" aria-labelledby="cats-title">
      <div class="section-head">
        <div>
          <h2 class="section-title" id="cats-title">${tx('home.catsTitle')}</h2>
          <p>${tx('home.catsSub')}</p>
        </div>
      </div>
      <ol class="cat-grid roadmap">
        ${categories.map((c, i) => {
          const list = lessons.filter((l) => l.category === c.id);
          const done = list.filter((l) => s.learned[l.id]).length;
          const pct = list.length ? Math.round((done / list.length) * 100) : 0;
          return `<li><a class="block cat-block" data-cat="${esc(c.id)}" href="#/lessons?cat=${esc(c.id)}">
            <div class="cat-top">
              <span class="cat-icon">${icon(c.icon)}</span>
              <span class="cat-step">${esc(t('home.levelN', { n: i + 1 }))}</span>
              <span class="cat-count" aria-hidden="true">${num(list.length)}</span>
            </div>
            <h3>${rich(L(c.title))}</h3>
            <p>${rich(L(c.description))}</p>
            <div class="cat-foot">
              <span class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${list.length}" aria-valuenow="${done}" aria-label="${esc(t('home.learnedOf', { n: done, m: list.length }))}"><span style="--value:${pct}%"></span></span>
              <span class="meter-label">${esc(t('home.learnedOf', { n: done, m: list.length }))}</span>
            </div>
          </a></li>`;
        }).join('')}
      </ol>
    </section>

    <section class="section" aria-labelledby="loop-title">
      <div class="section-head">
        <div>
          <h2 class="section-title" id="loop-title">${tx('home.loopTitle')}</h2>
          <p>${tx('home.loopSub')}</p>
        </div>
      </div>
      <ol class="loop-grid" style="list-style:none;padding:0;margin:0">
        ${t('home.loop').map(([title, body], i) => `<li class="clay loop-step">
          <span class="num" aria-hidden="true">${num(i + 1)}</span>
          <h3>${icon(LOOP_ICONS[i])}${rich(title)}</h3>
          <p>${rich(body)}</p>
        </li>`).join('')}
      </ol>
    </section>`;
}
