/* ══ Footer.tsx — dark coffee footer ════════════════════════ */
import { Link } from "react-router-dom";
import { Logo, Brand } from "./ui";

const COLS: [string, [string, string][]][] = [
  ["Explore", [["Organizations", "/organizations"], ["Agent skills", "/projects"], ["Hackathons", "/hackathons"], ["Resources", "/resources"]]],
  ["Your space", [["Dashboard", "/dashboard"], ["Saved projects", "/dashboard"], ["Activity", "/dashboard"]]],
  ["About", [["About us", "/about"], ["Data & methodology", "/about#data"], ["FAQ", "/about#faq"]]],
  ["Legal", [["Privacy policy", "/privacy"], ["Terms of service", "/terms"], ["Cookie policy", "/cookies"], ["Affiliations", "/affiliations"]]],
];

const HeartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#e0644a" aria-hidden className="inline-block align-[-2px]">
    <path d="M12 21c-4.8-3.6-9.3-7.5-9.3-12A5.2 5.2 0 0 1 12 6.1 5.2 5.2 0 0 1 21.3 9c0 4.5-4.5 8.4-9.3 12Z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="mt-[110px] bg-coffee text-steam">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] max-[1020px]:grid-cols-2 gap-10 pt-16 pb-11">
          <div>
            <Link to="/" className="flex items-center gap-2.5 text-foam"><Logo /><Brand /></Link>
            <p className="text-[13.5px] leading-[1.7] mt-3.5 max-w-[300px]">
              The catalog of top company hackathons and the skills, rules, configs and MCP servers that power AI coding agents - with a prep plan for every deadline.
            </p>
          </div>
          {COLS.map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[11px] uppercase tracking-[.12em] text-dimdk mb-4 font-mono font-medium">{title}</h4>
              <ul className="grid gap-2.5 list-none">
                {links.map(([l, to]) => <li key={l}><Link className="text-[13.5px] hover:text-white" to={to}>{l}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-bean py-5.5 flex justify-between items-center gap-3 flex-wrap text-dimdk text-[12.5px]">
          <span className="flex items-center gap-1.5">Made with <HeartIcon /> by <b className="text-steam font-semibold">Aditya</b> · © 2026 cyrus.ai</span>
          <a className="text-steam hover:text-white" href="https://github.com" target="_blank" rel="noopener">Powered by open source ↗</a>
        </div>
      </div>
    </footer>
  );
}
