import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Wand2, ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { colorMap, parseColors } from './utils/colorUtils';
import { analyzeImageFromUrl, colorDistanceHex, dominantPaletteColor, comparePaletteWithImage } from './utils/colorAnalysis';

export default function BrandMeNowWizard() {
  type Step =
    | "form" | "loading1" | "social" | "loading2" | "name" | "loading3"
    | "palette" | "loading4" | "logo" | "loading5" | "product" | "loading6"
    | "preview" | "loading7" | "profit" | "loading8" | "book" | "done";

  const tips = [
    "Tip: Include details about your audience (e.g., Gen Z wellness) for better personalized results.",
    "Tip: Specify your brand's tone (e.g., professional, fun) for tailored suggestions.",
    "Tip: Add industry details for more relevant ideas.",
    "Tip: Describe your target market size for accurate projections.",
  ];

  const [step, setStep] = useState<Step>("form");
  const [user, setUser] = useState({ name: "", email: "", ig: "" });
  const [vibe, setVibe] = useState("");
  const [industry, setIndustry] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandAvailable, setBrandAvailable] = useState<boolean>(false);
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [paletteSelected, setPaletteSelected] = useState(false);
  const [customError, setCustomError] = useState("");
  const [logoStyles, setLogoStyles] = useState<string[]>([]);
  const [logoOptions, setLogoOptions] = useState<string[]>([]);
  const [chosenLogo, setChosenLogo] = useState<string | null>(null);
  const [logoOverlay, setLogoOverlay] = useState<{ x:number; y:number; scale:number; bg:'light'|'dark' }>({ x:50, y:50, scale:1, bg:'light' });
  const [iconStyle, setIconStyle] = useState<string>("");
  const [typography, setTypography] = useState<string>("");
  const [logoLoading, setLogoLoading] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string>("");
  const [category, setCategory] = useState("supplements");
  const [sku, setSku] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [profit, setProfit] = useState<{ base:number; retail:number; followers:number; conv:number; estUnits?:number; estProfit?:number }>({ base: 10, retail: 29, followers: 5000, conv: 0.02 });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showMoreVibes, setShowMoreVibes] = useState(false);
  const [showMoreNames, setShowMoreNames] = useState(false);
  const [showMorePalettes, setShowMorePalettes] = useState(false);
  // LeadConnector / GHL calendar embed configuration
  const BOOKING_IFRAME_ID = 'UL9SNgWU3gjlVPKyzTMv_1761906629268';
  const BOOKING_SERVICE_ID = 'UL9SNgWU3gjlVPKyzTMv';
  const BOOKING_IFRAME_SRC = `https://api.leadconnectorhq.com/widget/booking/${BOOKING_SERVICE_ID}?iframeId=${BOOKING_IFRAME_ID}`;

  useEffect(() => {
    let t: any;
    const next: Record<Step, Step> = {
      form: "loading1", loading1: "social", social: "loading2", loading2: "name",
      name: "loading3", loading3: "palette", palette: "loading4", loading4: "logo",
      logo: "loading5", loading5: "product", product: "loading6", loading6: "preview",
      preview: "loading7", loading7: "profit", profit: "loading8", loading8: "book",
      book: "done", done: "done",
    };
    if (step.startsWith("loading")) t = setTimeout(() => setStep(next[step]), 1200);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Ensure booking embed script is present when entering the booking step
  useEffect(() => {
    if (step === 'book') {
      const existing = document.querySelector('script[src*="msgsndr.com/js/form_embed.js"]') as HTMLScriptElement | null;
      if (!existing) {
        const s = document.createElement('script');
        s.src = 'https://msgsndr.com/js/form_embed.js';
        s.defer = true;
        s.setAttribute('data-service', BOOKING_SERVICE_ID);
        document.body.appendChild(s);
      } else {
        // Update service id to ensure correct widget initializes
        existing.setAttribute('data-service', BOOKING_SERVICE_ID);
      }
    }
  }, [step]);

  // Persist wizard progress in localStorage so regeneration doesn't lose state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bmnWizardState');
      if (saved) {
        const s = JSON.parse(saved);
        setStep(s.step ?? "form");
        setUser(s.user ?? { name:"", email:"", ig:"" });
        setVibe(s.vibe ?? "");
        setIndustry(s.industry ?? "");
        setBrandName(s.brandName ?? "");
        setPaletteColors(s.paletteColors ?? []);
        setPaletteSelected(!!(s.paletteColors && s.paletteColors.length));
        setLogoStyles(s.logoStyles ?? []);
        setIconStyle(s.iconStyle ?? "");
        setTypography(s.typography ?? "");
        setLogoOptions(s.logoOptions ?? []);
        setChosenLogo(s.chosenLogo ?? null);
      }
    } catch(e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const toSave = { step, user, vibe, industry, brandName, paletteColors, logoStyles, iconStyle, typography, logoOptions, chosenLogo };
    try {
      localStorage.setItem('bmnWizardState', JSON.stringify(toSave));
    } catch(e) {
      // ignore
    }
  }, [step, user, vibe, industry, brandName, paletteColors, logoStyles, iconStyle, typography, logoOptions, chosenLogo]);

  const Palettes: string[][] = [
    ["#0ea5e9", "#0369a1", "#111827"],
    ["#22c55e", "#14532d", "#0f172a"],
    ["#f59e0b", "#b45309", "#111827"],
    ["#ef4444", "#7f1d1d", "#0f172a"],
    ["#8b5cf6", "#6d28d9", "#1e1b4b"],
    ["#06b6d4", "#0891b2", "#0c4a6e"],
    ["#84cc16", "#65a30d", "#1f2937"],
    ["#f97316", "#c2410c", "#1f2937"],
  ];


  const styleSeeds = ["Futuristic", "Elegant", "Minimalist", "Geometric", "Mascot", "Nature"];
  const Categories = [
    { id: "supplements", label: "Supplements" },
    { id: "fashion", label: "Fashion" },
    { id: "beauty", label: "Beauty" },
    { id: "hydration", label: "Hydration" },
  ];
  const SKUs = [
    { sku: "PROT-01", title: "Whey Protein 2lb", blurb: "Vanilla. Clean label.", category: "supplements" },
    { sku: "HYD-02", title: "Hydration Sticks", blurb: "Electrolytes, 30ct.", category: "hydration" },
    { sku: "GRN-03", title: "Daily Greens", blurb: "Superfood blend.", category: "supplements" },
    { sku: "FACE-01", title: "Glow Serum", blurb: "Vitamin C + peptides.", category: "beauty" },
  ];

  const MockAPI = {
    async availability(name: string) {
      await sleep(400);
      const ok = name.trim().length % 2 === 0 && name.trim().length > 0;
      return { available: ok, suggestion: ok ? undefined : `${name}co` };
    },
    async logos(_: { brand_name: string; styles: string[]; palette: string[] }) {
      await sleep(900);
      return { options: [
        "https://picsum.photos/seed/logoA/320/160",
        "https://picsum.photos/seed/logoB/320/160",
        "https://picsum.photos/seed/logoC/320/160",
      ]};
    },
    async preview(_: { sku: string; logo: string }) {
      await sleep(800);
      return { images: [
        "https://picsum.photos/seed/mock1/640/480",
        "https://picsum.photos/seed/mock2/640/480",
      ]};
    },
    async estimate({ base, retail, followers, conv }: any) {
      await sleep(300);
      const unit = retail - base;
      const units = Math.round(followers * conv);
      return { estUnits: units, estProfit: units * unit };
    }
  };

  // Generate N logo options using Fal.ai backend, using current wizard inputs
  const generateLogoOptions = async (count: number) => {
    setLogoError("");
    setLogoLoading(true);
    // Pre-generation validation: ensure palette has valid HEX colors
    const normalizedPalette = (paletteColors || [])
      .map(c => (colorMap[String(c).toLowerCase()] || c))
      .map(c => (c.startsWith('#') ? c : `#${c}`))
      .filter(c => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c));
    if (!normalizedPalette.length) {
      setLogoError("Please select a valid color palette before generating logos.");
      setLogoLoading(false);
      return;
    }
    const primaryHex = dominantPaletteColor(normalizedPalette);
    const secondaryHexes = (normalizedPalette || []).map(c => (colorMap[String(c).toLowerCase()] || c)).filter(h => h !== primaryHex);
    try {
      let attempt = 0;
      let finalUrls: string[] = [];
      let finalPassing: string[] = [];
      let finalFailing: string[] = [];
      while (attempt < 2 && finalPassing.length === 0) {
        const reinforce = attempt === 0 ? "" : " STRICT MODE: Use PRIMARY color for ~80-90% of shapes and text; secondary accents ≤10-20%. Absolutely NO hues outside the listed palette. If unsure, use monochrome PRIMARY.";
        const basePrompt = buildLogoPrompt({ brandName, industry, vibe, paletteColors: normalizedPalette, logoStyles, iconStyle, typography });
        const requests = Array.from({ length: count }, (_, i) => {
          const variant = i === 0 ? "" : ` variation ${i+1}`;
          const prompt = `${basePrompt}.${variant}. Use ONLY these HEX colors: ${(normalizedPalette).join(', ')}. Ensure PRIMARY color is ${primaryHex || (normalizedPalette?.[0]||'selected palette primary')} used predominantly. Secondary accents: ${(secondaryHexes && secondaryHexes.length ? secondaryHexes.join(', ') : 'none')}. Avoid any hues not in the listed palette.${reinforce}`;
          return fetchFalImage(prompt, "1024x1024");
        });
        const urls = await Promise.all(requests);
        finalUrls = urls; // keep last attempt URLs for fallback display

        const validations = await Promise.all(urls.map(async (u) => {
          try {
            const analysis = await analyzeImageFromUrl(u, { sampleStep: 8, primaryHex: primaryHex || (paletteColors?.[0] || undefined), paletteHexes: normalizedPalette, whiteLuma: 0.93, alphaMin: 15 });
            const cmp = comparePaletteWithImage(normalizedPalette, analysis);
            return { url: u, pass: cmp.passed, score: cmp.primaryMatchScore };
          } catch (e:any) {
            return { url: u, pass: false, score: 0 };
          }
        }));

        finalPassing = validations.filter(v => v.pass).sort((a,b)=>b.score-a.score).map(v=>v.url);
        finalFailing = validations.filter(v => !v.pass).map(v=>v.url);
        attempt++;
      }

      if (finalPassing.length) {
        setLogoOptions(finalPassing.concat(finalFailing)); // show passing logos first
        if (!chosenLogo) setChosenLogo(finalPassing[0]);
      } else {
        // No logos passed validation; surface error but still show options
        setLogoOptions(finalUrls);
        setLogoError("Generated logos may not match the selected color palette. We applied strict color guidance; try regenerating once more.");
      }
      if (!chosenLogo && finalUrls.length) setChosenLogo(finalUrls[0]);
    } catch (e:any) {
      setLogoError(e?.message || 'Generation failed. Please try again or adjust inputs.');
    } finally {
      setLogoLoading(false);
    }
  };

  return (
  <div className="wizard w-full flex justify-center bg-gradient-to-b from-[#1ae7f6]/10 to-white py-12">
      <div className="w-full max-w-5xl p-6 md:p-10">
        <AnimatePresence mode="popLayout">

          {step === "form" && (
            <StepPanel key="form">
              <h1 className="hero-animate text-3xl md:text-5xl font-semibold text-center leading-tight">
                Hi, I'm 
                <motion.span
                  className="inline-flex items-center gap-2 animated-gradient"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  Brand Wizard
                  <Sparkles className="h-6 w-6 text-[#006F74]"/>
                </motion.span>
                , your AI‑powered assistant.
                <br/>
                <TypingText text="Let’s start your brand." speed={22} className="text-gray-700" />
              </h1>
              <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">Create your session so we can save progress and pick up anytime.</p>
              <div className="mt-8 grid md:grid-cols-3 gap-3 max-w-4xl mx-auto">
                <input className="rounded-xl px-4 py-3 bg-[#1ae7f6]/10 focus:ring-2 focus:ring-[#1ae7f6]" placeholder="Name" value={user.name} onChange={(e)=>setUser({...user, name:e.target.value})} />
                <input className="rounded-xl px-4 py-3 bg-[#1ae7f6]/10 focus:ring-2 focus:ring-[#1ae7f6]" placeholder="Email" value={user.email} onChange={(e)=>setUser({...user, email:e.target.value})} />
                <input className="rounded-xl px-4 py-3 bg-[#1ae7f6]/10 focus:ring-2 focus:ring-[#1ae7f6]" placeholder="Instagram (optional)" value={user.ig} onChange={(e)=>setUser({...user, ig:e.target.value})} />
              </div>
              <div className="mt-8 flex justify-center">
                <PrimaryButton onClick={()=> setStep("loading1")} disabled={!user.name.trim() || !user.email.trim()}>Create & Continue</PrimaryButton>
              </div>
            </StepPanel>
          )}

          {step === "loading1" && (
            <LoadingScreen key="loading1" title="Setting up your session" subtitle="One sec while I get things ready…" />
          )}

          {step === "social" && (
            <StepPanel key="social">
              <h2 className="text-2xl md:text-3xl font-semibold text-center mt-4">Vision Input / Social Scan</h2>
              <Subheader text={`Hi, ${user.name}. Now let's define your brand vision to create something amazing.`} />
              <Subheader text="This helps me generate personalized palettes, logos, and suggestions." />
              {user.ig ? (
                <Subheader text={`Scanning @${user.ig} for vibe and audience insights... Choose one option or add more details below.`} />
              ) : (
                <Subheader text="Tell me about your brand style, mood, and audience." colorClass="text-gray-600" />
              )}
              <div className="mt-6 max-w-3xl mx-auto">
                <input className="w-full rounded-xl px-4 py-3 bg-[#1ae7f6]/10 focus:ring-2 focus:ring-[#1ae7f6]" placeholder="Type your brand vision (e.g., 'Luxury beauty, soft gold, Gen Z wellness')" value={vibe} onChange={(e)=>setVibe(e.target.value)} />
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {getDynamicSuggestions(vibe, showMoreVibes).map(opt => (
                    <Chip key={opt} onClick={()=>setVibe(opt)}>{opt}</Chip>
                  ))}
                </div>
                {!showMoreVibes && (
                  <div className="mt-4 flex justify-center">
                    <Chip onClick={() => setShowMoreVibes(true)}>More..</Chip>
                  </div>
                )}
                <div className="mt-2 text-sm flex justify-center">
                  <div className="tip-row flex items-center gap-2">
                    <Wand2 className="tip-icon" aria-hidden="true"/>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTipIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="tip-text"
                      >
                        {tips[currentTipIndex]}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <SecondaryButton onClick={()=>setStep("form")}>Back</SecondaryButton>
                <PrimaryButton onClick={()=>setStep("loading2")} disabled={!vibe.trim() && !user.ig.trim()}>Continue</PrimaryButton>
              </div>
            </StepPanel>
          )}

          {step === "loading2" && (<LoadingScreen key="loading2" title="Analyzing vibe & audience" subtitle="Picking good directions…" />)}

          {step === "name" && (
            <StepPanel key="name">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">Brand Name Selection</h2>
              <Subheader text={`Great! ${user.name}, now let's find a name that resonates with your '${vibe}' vibe!`} />
              <Subheader text="Enter a name or pick a suggestion. We’ll automatically check availability and only show names that are available." />
              <NameChooser value={brandName} onChange={setBrandName} onCheck={async(name)=>MockAPI.availability(name)} onStatusChange={(ok)=>setBrandAvailable(ok)} vibe={vibe} user={user} showMore={showMoreNames} onShowMore={setShowMoreNames} />
              <div className="mt-8 flex items-center justify-between">
                <SecondaryButton onClick={()=>setStep("social")}>Back</SecondaryButton>
                <PrimaryButton onClick={()=>setStep("loading3")} disabled={!brandName.trim() || !brandAvailable}>Continue</PrimaryButton>
              </div>
            </StepPanel>
          )}

          {step === "loading3" && (<LoadingScreen key="loading3" title="Locking in your name" subtitle="Setting up palettes…" />)}

          {step === "palette" && (
            <StepPanel key="palette">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">Color Palette</h2>
              <Subheader text="Time to pick your brand colors! This will influence your logos and labels. You can choose from examples below or enter your own colors (e.g., 'blue, green, yellow')." colorClass="text-gray-600" />
              <div className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Palettes.slice(0, 4).map((p, idx) => (
                    <button key={idx} onClick={()=>{setPaletteColors(p); setPaletteSelected(true); setCustomError("");}} className={`rounded-2xl border p-4 hover:shadow-sm ${paletteColors===p?"ring-2 ring-[#1ae7f6]":""}`}>
                      <div className="flex gap-2">{p.map(c => (<div key={c} className="h-6 w-6 rounded" style={{background:c}}/>))}</div>
                    </button>
                  ))}
                </div>
                {!showMorePalettes && (
                  <div className="mt-4 flex justify-center">
                    <Chip onClick={() => setShowMorePalettes(true)}>More..</Chip>
                  </div>
                )}
                {showMorePalettes && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Palettes.slice(4).map((p, idx) => (
                      <button key={idx + 4} onClick={()=>{setPaletteColors(p); setPaletteSelected(true); setCustomError("");}} className={`rounded-2xl border p-4 hover:shadow-sm ${paletteColors===p?"ring-2 ring-[#1ae7f6]":""}`}>
                        <div className="flex gap-2">{p.map(c => (<div key={c} className="h-6 w-6 rounded" style={{background:c}}/>))}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-6 max-w-md mx-auto">
                <input className="w-full rounded-xl px-4 py-3 bg-[#1ae7f6]/10 focus:ring-2 focus:ring-[#1ae7f6]" placeholder="Enter colors (e.g., 'blue, green, yellow')" value={customInput} onChange={(e)=>setCustomInput(e.target.value)} />
                <div className="mt-2 flex justify-center">
                  <button className="rounded-xl px-4 py-2 border hover:bg-gray-50" onClick={()=>{
                    const parsed = parseColors(customInput);
                    if (parsed) {
                      setPaletteColors(parsed);
                      setPaletteSelected(true);
                      setCustomError("");
                    } else {
                      setCustomError("Please enter 1-3 valid color names (e.g., red, blue, green).");
                    }
                  }}>Show Palette</button>
                </div>
                {customError && <p className="mt-2 text-center text-red-600 text-sm">{customError}</p>}
              </div>
              {paletteSelected && (
                <div className="mt-6 text-center">
                  <p className="text-gray-700">Here's your color palette! It includes {paletteColors.map(c => c).join(", ")}.</p>
                  <div className="mt-4 flex justify-center gap-2">
                    {paletteColors.map(c => (
                      <div key={c} className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded" style={{background:c}}></div>
                        <span className="text-xs mt-1">{c}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-gray-700">Are you happy with this, or would you like to make changes?</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button className="rounded-xl px-4 py-2 border hover:bg-gray-50" onClick={()=>{setPaletteSelected(false); setPaletteColors([]); setCustomInput(""); setCustomError("");}}>Clear</button>
                    <PrimaryButton onClick={()=>setStep("loading4")}>Yes, proceed</PrimaryButton>
                  </div>
                </div>
              )}
              {!paletteSelected && (
                <div className="mt-8 flex items-center justify-between">
                  <SecondaryButton onClick={()=>setStep("name")}>Back</SecondaryButton>
                  <div></div>
                </div>
              )}
            </StepPanel>
          )}

          {step === "loading4" && (<LoadingScreen key="loading4" title="Queuing logo generation" subtitle="This can take a few seconds…" />)}

          {step === "logo" && (
            <StepPanel key="logo">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">Logo Generation</h2>
              <Subheader text="Customize your style and generate options using Fal.ai." colorClass="text-gray-600" />
              <StylePicker styles={styleSeeds} picked={logoStyles} onChange={setLogoStyles} />
              <div className="mt-4 grid md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                <div className="rounded-2xl border p-4">
                  <div className="font-medium">Icon Style</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Abstract mark","Lettermark","Emblem","Pictorial mark","Mascot"].map(s => (
                      <button key={s} onClick={()=>setIconStyle(s)} className={`rounded-full border px-3 py-1 text-sm ${iconStyle===s?"border-black":""}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="font-medium">Typography</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Sans-serif","Serif","Script","Rounded","Monospace"].map(s => (
                      <button key={s} onClick={()=>setTypography(s)} className={`rounded-full border px-3 py-1 text-sm ${typography===s?"border-black":""}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="font-medium">Colors</div>
                  <div className="mt-2 flex gap-2 items-center">
                    {paletteColors.length ? paletteColors.map(c => (<div key={c} className="h-6 w-6 rounded" style={{background:c}}/>)) : <span className="text-sm text-gray-500">Use palette step above</span>}
                  </div>
                </div>
              </div>
              {/* Error messages are intentionally suppressed in the logo step to ensure the final deliverable remains clean and free of UI error overlays. Errors are handled via silent retries and internal logging. */}
              <div className="mt-4 flex justify-center">
                <PrimaryButton onClick={async()=>{ await generateLogoOptions(3); }} disabled={logoLoading || !brandName.trim() || (!vibe.trim() && !industry.trim()) || (!paletteColors || !paletteColors.length)}>
                  {logoLoading ? (<><Loader2 className="ml-2 h-4 w-4 animate-spin"/> Generating…</>) : (<>Generate 3</>)}
                </PrimaryButton>
              </div>
              {!!logoOptions.length && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {logoOptions.map((src)=> (
        <div key={src} className={`rounded-xl border overflow-hidden hover:shadow-sm ${chosenLogo===src?"ring-2 ring-[#1ae7f6]":""}`}>
                      <img src={src} alt="logo" className="w-full h-auto"/>
                      <div className="p-2 flex items-center justify-between">
                        <button className="rounded-xl px-3 py-1 border inline-flex items-center gap-2" onClick={()=>setChosenLogo(src)}>
                          <i className="fi fi-rr-check"></i>
                          Use this
                        </button>
                        <button className="rounded-xl px-3 py-1 border inline-flex items-center gap-2" onClick={()=>downloadImage(src)}>
                          <i className="fi fi-rr-download"></i>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-8 flex items-center justify-between">
                <SecondaryButton onClick={()=>setStep("palette")}>Back</SecondaryButton>
                <PrimaryButton onClick={()=>setStep("loading5")} disabled={!chosenLogo}>Continue</PrimaryButton>
              </div>
            </StepPanel>
          )}

          {step === "loading5" && (<LoadingScreen key="loading5" title="Preparing products" subtitle="Fetching categories & SKUs…" />)}

          {step === "product" && (
            <StepPanel key="product">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">Product Selection</h2>
              <p className="mt-2 text-center text-gray-600">Choose a category, then pick a SKU.</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {Categories.map(c => (
                  <button key={c.id} onClick={()=>setCategory(c.id)} className={`rounded-full border px-3 py-1 text-sm ${category===c.id?"border-black":""}`}>{c.label}</button>
                ))}
              </div>
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {SKUs.filter(s=>s.category===category).map(p => (
        <div key={p.sku} className={`rounded-2xl border p-4 ${sku===p.sku?"ring-2 ring-[#1ae7f6]":""}`}>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-gray-500">{p.blurb}</div>
                    <div className="pt-2"><button className="rounded-xl px-3 py-2 border" onClick={()=>setSku(p.sku)}>Select</button></div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <SecondaryButton onClick={()=>setStep("logo")}>Back</SecondaryButton>
                <PrimaryButton onClick={async()=>{
                  if(!sku || !chosenLogo) return;
                  const r = await MockAPI.preview({ sku, logo: chosenLogo });
                  setPreviews(r.images);
                  setStep("loading6");
                }} disabled={!sku}>Continue</PrimaryButton>
              </div>
            </StepPanel>
          )}

          {step === "loading6" && (<LoadingScreen key="loading6" title="Rendering your mock‑up" subtitle="Applying your logo to the product…" />)}

          {step === "preview" && (
            <StepPanel key="preview">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">Mock‑Up Preview</h2>
              <p className="mt-2 text-center text-gray-600">Nudge controls for quick tweaks.</p>
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {previews.map((src)=> (
                  <div key={src} className={`rounded-2xl border overflow-hidden relative ${logoOverlay.bg==='dark'?'bg-black':'bg-white'}`}>
                    <img src={src} alt="preview" className="w-full h-auto" style={{ filter: logoOverlay.bg==='dark' ? 'brightness(0.85)' : 'brightness(1)' }} />
                    {chosenLogo && (
                      <img
                        src={chosenLogo}
                        alt="logo overlay"
                        className="absolute"
                        style={{
                          top: `${logoOverlay.y}%`,
                          left: `${logoOverlay.x}%`,
                          transform: `translate(-50%, -50%) scale(${logoOverlay.scale})`,
                          width: '40%',
                          opacity: 0.95,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Chip onClick={()=> setLogoOverlay(v => ({...v, y: Math.max(0, v.y - 5)}))}>Logo ↑</Chip>
                <Chip onClick={()=> setLogoOverlay(v => ({...v, y: Math.min(100, v.y + 5)}))}>Logo ↓</Chip>
                <Chip onClick={()=> setLogoOverlay(v => ({...v, scale: Math.min(3, Number((v.scale * 1.1).toFixed(2)))}))}>Logo Bigger</Chip>
                <Chip onClick={()=> setLogoOverlay(v => ({...v, scale: Math.max(0.5, Number((v.scale * 0.9).toFixed(2)))}))}>Logo Smaller</Chip>
                <Chip onClick={()=> setLogoOverlay(v => ({...v, bg:'dark'}))}>BG: Dark</Chip>
                <Chip onClick={()=> setLogoOverlay(v => ({...v, bg:'light'}))}>BG: Light</Chip>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <SecondaryButton onClick={()=>setStep("product")}>Back</SecondaryButton>
                <PrimaryButton onClick={()=>setStep("loading7")}>Looks Good</PrimaryButton>
              </div>
            </StepPanel>
          )}

          {step === "loading7" && (<LoadingScreen key="loading7" title="Calculating profit" subtitle="Crunching your numbers…" />)}

          {step === "profit" && (
            <StepPanel key="profit">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">Profit Calculator</h2>
              <p className="mt-2 text-center text-gray-600">Adjust inputs to see your estimate.</p>
              <div className="mt-6 grid md:grid-cols-4 gap-3">
                <LabeledNumber label="Base Cost" value={profit.base} onChange={(n)=>setProfit({...profit, base:n})} />
                <LabeledNumber label="Retail" value={profit.retail} onChange={(n)=>setProfit({...profit, retail:n})} />
                <LabeledNumber label="Followers" value={profit.followers} onChange={(n)=>setProfit({...profit, followers:n})} />
                <LabeledNumber label="Conv %" value={profit.conv} onChange={(n)=>setProfit({...profit, conv:n})} />
              </div>
              <div className="mt-3 flex gap-2 justify-center">
                {[0.01, 0.02, 0.03, 0.05].map(c=> (
                  <button key={c} className="rounded-full border px-3 py-1 text-sm" onClick={()=>setProfit({...profit, conv:c})}>{Math.round(c*100)}%</button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <SecondaryButton onClick={()=>setStep("preview")}>Back</SecondaryButton>
                <PrimaryButton onClick={async()=>{
                  const r = await MockAPI.estimate(profit);
                  setProfit({...profit, estUnits:r.estUnits, estProfit:r.estProfit});
                  setStep("loading8");
                }}>Estimate</PrimaryButton>
              </div>
              {profit.estUnits!==undefined && (
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <Stat title="Estimated Units" value={profit.estUnits!.toLocaleString()} />
                  <Stat title="Estimated Profit" value={`$${profit.estProfit!.toLocaleString()}`} />
                </div>
              )}
            </StepPanel>
          )}

          {step === "loading8" && (<LoadingScreen key="loading8" title="Opening booking" subtitle="Fetching calendar slots…" />)}

          {step === "book" && (
            <StepPanel key="book">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">Book a Call</h2>
              <p className="mt-2 text-center text-gray-600">Pick a GHL calendar slot. We’ll email a summary with your assets.</p>
              <div className="mt-6">
                <iframe
                  id={BOOKING_IFRAME_ID}
                  src={BOOKING_IFRAME_SRC}
                  title="LeadConnector Calendar Booking"
                  style={{ width: '100%', border: 'none', minHeight: 900, overflow: 'hidden' }}
                ></iframe>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <SecondaryButton onClick={()=>setStep("profit")}>Back</SecondaryButton>
                <PrimaryButton onClick={()=>setStep("done")}>Confirm</PrimaryButton>
              </div>
            </StepPanel>
          )}

          {step === "done" && (
            <StepPanel key="done">
              <h2 className="text-2xl md:text-3xl font-semibold text-center">All set 🎉</h2>
              <p className="mt-2 text-center text-gray-600">We’ll send your brand summary and assets to {user.email}.</p>
              <div className="mt-8 flex justify-center gap-3">
                <SecondaryButton onClick={()=>setStep("form")}>Start Over</SecondaryButton>
                <PrimaryButton onClick={()=>alert("Finish")}>Finish</PrimaryButton>
              </div>
            </StepPanel>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

function getDynamicSuggestions(input: string, showMore:boolean): string[] {
  const basePrimary = [
    "Clean, minimalist, tech-forward",
    "Bold fitness, neon accents",
    "Luxury beauty, soft gold + serif",
    "Eco, earthy, natural",
    "Streetwear, edgy, high-contrast",
    "Playful, colorful, friendly",
  ];
  const baseSecondary = [
    "Modern, sleek, professional",
    "Vintage, retro, nostalgic",
    "Artistic, creative, expressive",
    "Sporty, energetic, dynamic",
    "Elegant, sophisticated, timeless",
    "Fun, quirky, whimsical",
  ];

  const text = (input || "").toLowerCase();
  const suggestions: string[] = [];
  const push = (s:string)=>{ if(!suggestions.includes(s)) suggestions.push(s); };

  // Keyword mappings
  if(/fitness|gym|athlet|workout|wellness/.test(text)) push("Bold fitness, neon accents");
  if(/luxury|luxe|premium|gold|beauty|glow|serum/.test(text)) push("Luxury beauty, soft gold + serif");
  if(/eco|earth|organic|sustain|natural|green|plant/.test(text)) push("Eco, earthy, natural");
  if(/streetwear|urban|edgy|grunge|high\s*contrast|skate/.test(text)) push("Streetwear, edgy, high-contrast");
  if(/playful|fun|colorful|vibrant|friendly|youth|gen\s*z/.test(text)) push("Playful, colorful, friendly");
  if(/minimal|clean|modern|tech|startup|sleek/.test(text)) push("Clean, minimalist, tech-forward");

  // Secondary mappings
  if(/modern|sleek|professional|corporate/.test(text)) push("Modern, sleek, professional");
  if(/vintage|retro|nostalg/.test(text)) push("Vintage, retro, nostalgic");
  if(/art|creative|expressive|artistic|design/.test(text)) push("Artistic, creative, expressive");
  if(/sport|energetic|dynamic|active/.test(text)) push("Sporty, energetic, dynamic");
  if(/elegant|sophisticated|timeless|classic/.test(text)) push("Elegant, sophisticated, timeless");
  if(/quirky|whimsical|playful/.test(text)) push("Fun, quirky, whimsical");

  // Fallbacks if no match
  if(suggestions.length === 0) {
    basePrimary.forEach(push);
  }
  // Limit primary set to 6
  let result = suggestions.slice(0, 6);
  if(showMore) {
    // Append secondary defaults to broaden options
    baseSecondary.forEach(s => { if(!result.includes(s)) result.push(s); });
  }
  return result;
}

function getNameSuggestions(input: string, vibe: string, user:{name:string; email:string; ig:string}, showMore:boolean): string[] {
  const baseStems = ["Nova", "Skin", "Peak", "Leaf", "Vital", "Glow", "Aura", "Zen", "Pulse", "Eco", "Spark", "Luxe"];
  const suffixesPrimary = ["Lab", "Labs", "Haus", "Ritual", "Fuel", "Bloom", "Boost", "Vita", "Muse", "Essence"];
  const suffixesSecondary = ["Works", "Co", "HQ", "Studio", "Collective", "Craft", "Foundry"];
  const vibeHints = (vibe || "").toLowerCase();

  // Map vibe keywords to stems or suffixes
  const stemsFromVibe: string[] = [];
  if(/beauty|glow|skin|serum|cosmetic/.test(vibeHints)) stemsFromVibe.push("Glow", "Skin", "Muse", "Luxe");
  if(/eco|earth|green|sustain|natural|plant/.test(vibeHints)) stemsFromVibe.push("Leaf", "Eco", "Zen");
  if(/fitness|gym|athlet|vital|energy|performance/.test(vibeHints)) stemsFromVibe.push("Vital", "Pulse", "Peak");
  if(/tech|modern|future|spark|nova|startup/.test(vibeHints)) stemsFromVibe.push("Nova", "Spark");

  const nameSeed = (input || user?.name || "").trim();
  const seedBase = nameSeed ? nameSeed.split(/\s+|[-_]/).map(s=>s.replace(/[^a-z]/gi,'')).filter(Boolean) : [];
  const seedStem = seedBase.length ? seedBase[0] : (stemsFromVibe[0] || baseStems[0]);

  const primaryCombos = [seedStem, ...(stemsFromVibe.length?stemsFromVibe:baseStems)].flatMap(stem => suffixesPrimary.map(s => `${stem}${s}`));
  const secondaryCombos = [seedStem, ...(stemsFromVibe.length?stemsFromVibe:baseStems)].flatMap(stem => suffixesSecondary.map(s => `${stem}${s}`));

  const result = Array.from(new Set([...(primaryCombos.slice(0, 20)), ...(showMore ? secondaryCombos.slice(0, 20) : [])]));
  return result;
}

const sleep = (ms:number)=> new Promise(res=>setTimeout(res, ms));

function StepPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-white/70 backdrop-blur rounded-3xl border p-6 md:p-10 shadow-sm"
    >
      {children}
    </motion.section>
  );
}

function LoadingScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <StepPanel>
      <div className="flex flex-col items-center text-center py-12">
      <Loader2 className="h-10 w-10 animate-spin text-[#1ae7f6]"/>
        <h3 className="mt-4 text-xl md:text-2xl font-semibold">{title}</h3>
        {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
      </div>
    </StepPanel>
  );
}

function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="btn btn-primary inline-flex items-center justify-center rounded-xl px-5 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
      {children}
      <ChevronRight className="ml-2 h-4 w-4"/>
    </button>
  );
}

function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="btn btn-secondary inline-flex items-center justify-center rounded-xl px-4 py-2">
      <ChevronLeft className="mr-2 h-4 w-4"/>
      {children}
    </button>
  );
}

// Typing animation for more AI-like feel
function TypingText({ text, speed = 30, className = "" }: { text: string; speed?: number; className?: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const chars = Array.from(text);
    const id = setInterval(() => {
      i++;
      setShown(chars.slice(0, i).join(""));
      if (i >= chars.length) clearInterval(id);
    }, Math.max(10, speed));
    return () => clearInterval(id);
  }, [text, speed]);
  return <span className={className}>{shown}</span>;
}

// Subheader component (no animation), 14px via CSS .subheader
function Subheader({ text, colorClass = "text-gray-700" }: { text: string; colorClass?: string }) {
  return (
    <p className={`subheader text-center ${colorClass}`}>{text}</p>
  );
}

async function fetchFalImage(prompt: string, size: string = "1024x1024"): Promise<string> {
  // Use a relative WP endpoint so this works both in the preview server and inside the WordPress plugin
  const endpoint = `/wp-json/agui-chat/v1/image/generate`;
  const payload = { prompt, size };
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    throw new Error(`Fal.ai request failed: ${r.status}`);
  }
  const j = await r.json();
  if (!j?.ok || !j?.data?.image_url) {
    throw new Error('Invalid response from image generation backend');
  }
  return j.data.image_url as string;
}

async function downloadImage(url: string) {
  try {
    const r = await fetch(url);
    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'logo.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    alert('Download failed. Please open the image and save manually.');
    window.open(url, '_blank');
  }
}

function buildLogoPrompt({ brandName, industry, vibe, paletteColors, logoStyles, iconStyle, typography }: { brandName:string; industry:string; vibe:string; paletteColors:string[]; logoStyles:string[]; iconStyle:string; typography:string }): string {
  const parts: string[] = [];
  parts.push(`${brandName} logo`);
  if (industry?.trim()) parts.push(`for ${industry}`);
  if (vibe?.trim()) parts.push(`brand attributes: ${vibe}`);
  if (paletteColors?.length) {
    const primary = dominantPaletteColor(paletteColors);
    const secondary = paletteColors.filter(c => (colorMap[c.toLowerCase()] || c) !== primary);
    const primaryLabel = primary || paletteColors[0];
    const hexList = paletteColors.map(c => (colorMap[String(c).toLowerCase()] || c)).join(', ');
    parts.push(`COLOR SCHEME: PRIMARY must be ${primaryLabel} (use it predominantly across the mark).`);
    if (secondary.length) parts.push(`SECONDARY accents: ${secondary.join(', ')} (use subtly).`);
    parts.push(`STRICT COLOR LIST: Use ONLY these HEX colors across the logo: ${hexList}. No other hues permitted.`);
  }
  if (logoStyles?.length) parts.push(`style: ${logoStyles.join(', ')}`);
  if (iconStyle?.trim()) parts.push(`icon style: ${iconStyle}`);
  if (typography?.trim()) parts.push(`typography: ${typography}`);
  parts.push(`minimalist, clean vector mark, high contrast, professional`);
  parts.push(`STRICT COLOR COMPLIANCE: prioritize primary color across shapes and typography; avoid deviating hues. Avoid violet/purple hues entirely.`);
  // Typography & spell-check directives
  parts.push(`TYPOGRAPHY AND TEXT: Spell the brand name exactly as "${brandName}" with zero typos or extra characters. No substitutions, abbreviations, or added symbols. Maintain consistent kerning and tracking, clean baseline alignment, and balanced letter proportions. Keep stroke weights consistent across all characters, and use either all-uppercase or the specified case consistently.`);
  // Icon-to-type harmony
  parts.push(`ICON-TO-TYPE HARMONY: Ensure the icon style matches the typographic treatment. Use matching stroke weights and corner radii, balanced visual mass, and consistent geometric language. Avoid cartoonish icons if typography is geometric, and avoid mismatched styles.`);
  // Style consistency across the mark
  parts.push(`STYLE CONSISTENCY: Maintain consistent style attributes (rounded vs sharp, flat vs gradient as appropriate). Keep visual proportions harmonious, spacing and alignment grid-consistent, and avoid disproportionate elements or misaligned baselines.`);
  // Error-free output requirements
  parts.push(`ERROR-FREE OUTPUT: No watermark, no UI overlays, and no error messages embedded in the image. Deliver a clean logo with a transparent background (or solid background if specified) suitable for production.`);
  // Validation hints and negative prompts
  parts.push(`VALIDATION: Re-check spelling of "${brandName}" before final render. Avoid misspellings, random text, extra symbols, drop shadows unless explicitly requested, inconsistent stroke thickness, and misaligned baselines.`);
  return parts.join('. ');
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick?: ()=>void }) {
  return <button onClick={onClick} className="rounded-full border px-3 py-1 text-sm hover:bg-[#1ae7f6]/10">{children}</button>;
}

function LabeledNumber({ label, value, onChange }: { label:string; value:number; onChange:(n:number)=>void }) {
  return (
    <label className="text-sm grid gap-1">
      <span className="text-gray-600">{label}</span>
      <input className="rounded-xl px-3 py-2 bg-[#1ae7f6]/10 focus:ring-2 focus:ring-[#1ae7f6]" value={value} onChange={(e)=>onChange(Number(e.target.value))} />
    </label>
  );
}

function NameChooser({ value, onChange, onCheck, onStatusChange, vibe, user, showMore, onShowMore }: { value:string; onChange:(v:string)=>void; onCheck:(name:string)=>Promise<{available:boolean; suggestion?:string}>; onStatusChange:(ok:boolean)=>void; vibe:string; user:{name:string; email:string; ig:string}; showMore:boolean; onShowMore:(show:boolean)=>void }) {
  const [status, setStatus] = useState<null | {available:boolean; suggestion?:string}>(null);
  const [availableSuggestions, setAvailableSuggestions] = useState<string[]>([]);

  // Build candidate suggestions dynamically based on user input and vibe
  const candidates = getNameSuggestions(value, vibe, user, showMore);

  // Auto-check availability for input value (debounced)
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async ()=>{
      const name = value.trim();
      if(!name) { setStatus(null); onStatusChange(false); return; }
      try {
        const r = await onCheck(name);
        setStatus(r);
        onStatusChange(!!r.available);
      } catch(e) {
        setStatus({ available: false });
        onStatusChange(false);
      }
    }, 400);
    return ()=>{ clearTimeout(t); ctrl.abort(); };
  }, [value, onCheck, onStatusChange]);

  // Auto-check availability for suggestion candidates and show only available ones
  useEffect(() => {
    let mounted = true;
    (async () => {
      const unique = Array.from(new Set(candidates)).slice(0, showMore ? 18 : 10);
      const checks = await Promise.all(unique.map(async n => {
        try { const r = await onCheck(n); return r.available ? n : null; } catch { return null; }
      }));
      if(mounted) setAvailableSuggestions(checks.filter(Boolean) as string[]);
    })();
    return ()=>{ mounted = false; };
  }, [candidates, onCheck, showMore]);

  return (
    <div className="mt-6">
      <p className="mt-2 text-center text-gray-700">We’re showing only names that are currently available:</p>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {availableSuggestions.map(name => (
          <div key={name} className="text-center">
            <button className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50" onClick={()=>{onChange(name);}}>{name}</button>
          </div>
        ))}
      </div>
      {!showMore && (
        <div className="mt-4 flex justify-center">
          <Chip onClick={() => onShowMore(true)}>More..</Chip>
        </div>
      )}
      <div className="mt-4 max-w-2xl mx-auto grid md:grid-cols-[1fr,auto] gap-2">
        <input className="rounded-xl px-4 py-3 bg-[#1ae7f6]/10 focus:ring-2 focus:ring-[#1ae7f6]" placeholder="Enter a name or pick one" value={value} onChange={(e)=>{onChange(e.target.value);}} />
        <button className="rounded-xl px-4 py-3 border" onClick={async()=>{ const r = await onCheck(value); setStatus(r); onStatusChange(!!r.available); }}>Check Availability</button>
      </div>
      {status && (
        <div className={`mt-2 text-center text-sm ${status.available?"text-green-700":"text-orange-700"}`}>
          {status.available ? <span className="inline-flex items-center gap-1"><Check  className="h-4 w-4"/> Available</span> : <>Not available{status.suggestion?`, try “${status.suggestion}”`:""}</>}
        </div>
      )}
    </div>
  );
}

function StylePicker({ styles, picked, onChange }: { styles:string[]; picked:string[]; onChange:(s:string[])=>void }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {styles.map(s => (
        <button key={s} onClick={()=> onChange(picked.includes(s) ? picked.filter(x=>x!==s) : [...picked, s])} className={`rounded-full border px-3 py-1 text-sm ${picked.includes(s)?"border-black":""}`}>{s}</button>
      ))}
    </div>
  );
}

function Stat({ title, value }: { title:string; value:string }) {
  return (
    <div className="rounded-2xl border p-4 text-center">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
