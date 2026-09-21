import { Gem, Leaf, ShieldCheck } from 'lucide-react';
import './AssuranceSection.css';

const ASSURANCE_ITEMS = [
  {
    icon: Gem,
    label: 'Quality Craftsmanship',
  },
  {
    icon: Leaf,
    label: 'Ethically Sourced',
  },
  {
    icon: ShieldCheck,
    label: '100% Transparency',
  },
];

export default function AssuranceSection() {
  return (
    <section className="assurance-section container" aria-label="AURA Assurance">
      <div className="assurance-inner">
        {/* Left column: Two-tone headline & tagline */}
        <div className="assurance-left">
          <h2 className="assurance-title">
            <span className="assurance-title-aura">AURA</span>{' '}
            <span className="assurance-title-accent">Assurance</span>
          </h2>
          <p className="assurance-tagline">
            Crafted with care, trusted for generations
          </p>
        </div>

        {/* Right column: 3 trust badges */}
        <div className="assurance-right">
          {ASSURANCE_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="assurance-badge">
              <div className="assurance-icon-wrap">
                <Icon size={44} strokeWidth={1.5} className="assurance-icon" />
              </div>
              <span className="assurance-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

