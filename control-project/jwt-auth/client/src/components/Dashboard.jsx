import { useEffect, useRef, useState } from 'react';
import test from '../assets/test.png';
import proctoring from '../assets/proctoring.png';
import analytics from '../assets/analytics.png';

const features = [
  {
    icon: test,
    title: 'Тестирование',
    desc: 'Собирайте тесты из готовых банков вопросов или создавайте свои — с таймером, случайным порядком и авто-проверкой.',
  },
  {
    icon: proctoring,
    title: 'Прокторинг',
    desc: 'Каждая попытка проходит под контролем ИИ: слежение за камерой, экраном и поведением — без человека в наблюдателях.',
  },
  {
    icon: analytics,
    title: 'Аналитика',
    desc: 'Результаты, динамика по группам и отчёты о подозрительной активности — в одном месте, сразу после теста.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Создайте тест',
    desc: 'Соберите вопросы, задайте время и правила — тест готов за пару минут.',
  },
  {
    n: '02',
    title: 'Кандидат проходит его под прокторингом',
    desc: 'Система следит за камерой и экраном в реальном времени, ничего не отвлекая кандидата.',
  },
  {
    n: '03',
    title: 'Вы получаете отчёт',
    desc: 'Баллы, время прохождения и все отмеченные нарушения — в аналитике сразу после сдачи.',
  },
];

function FadeInOnScroll({ children, delay = 0, className = '', style = {} }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const currentRef = domRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`scroll-fade-in ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="dashboard-home">
      {/* Hero */}
      <section className="home-hero">
        <FadeInOnScroll className="home-hero-text">
          <span className="home-eyebrow">Платформа онлайн-тестирования</span>
          <h1 className="home-title">
            Проверяйте знания так же честно,
            <br />
            как в аудитории — только удалённо
          </h1>
          <p className="home-subtitle">
            Тестирование, прокторинг и аналитика в одном месте. Кандидат
            сдаёт тест из дома — вы получаете результат, которому можно
            доверять.
          </p>
          <div className="home-cta-row">
            <button type="button" className="home-btn-ghost">
              Как это работает
            </button>
          </div>
          <div className="home-live-badge">
            <span className="home-live-dot" />
            Мониторинг активен — 3 сессии прямо сейчас
          </div>
        </FadeInOnScroll>

        <div className="home-stats">
          {[
            { val: '10 000+', label: 'тестов пройдено' },
            { val: '99.2%', label: 'точность прокторинга' },
            { val: '24/7', label: 'контроль сессий' },
          ].map((stat, idx) => (
            <FadeInOnScroll key={idx} delay={150 + idx * 100} className="home-stat">
              <span className="home-stat-value">{stat.val}</span>
              <span className="home-stat-label">{stat.label}</span>
            </FadeInOnScroll>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <FadeInOnScroll>
          <h2 className="home-section-title">Три модуля — один процесс</h2>
        </FadeInOnScroll>
        <div className="home-features-grid">
          {features.map((f, idx) => (
            <FadeInOnScroll key={f.title} delay={idx * 120} className="home-feature-card">
              <img src={f.icon} alt="" aria-hidden="true" className="home-feature-icon" />
              <h3 className="home-feature-title">{f.title}</h3>
              <p className="home-feature-desc">{f.desc}</p>
            </FadeInOnScroll>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="home-process">
        <FadeInOnScroll>
          <h2 className="home-section-title">Как это работает</h2>
        </FadeInOnScroll>
        <div className="home-process-row">
          {steps.map((s, idx) => (
            <FadeInOnScroll key={s.n} delay={idx * 120} className="home-process-step">
              <span className="home-process-n">{s.n}</span>
              <h3 className="home-process-title">{s.title}</h3>
              <p className="home-process-desc">{s.desc}</p>
            </FadeInOnScroll>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="home-banner">
        <FadeInOnScroll className="home-banner-content" style={{ width: '100%' }}>
          <div>
            <h2 className="home-banner-title">Готовы провести первый тест?</h2>
            <p className="home-banner-desc">
              Настройка занимает меньше десяти минут.
            </p>
          </div>
        </FadeInOnScroll>
      </section>
    </div>
  );
}