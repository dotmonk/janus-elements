import Component,
 {
 html,
 
} from "../../janus/index.js";
 import "../../janus/ui/Button.js";
 import "../../janus/ui/Select.js";
 import "../../janus/ui/Textarea.js";
 import "../../janus/ui/Field.js";
 import "../../janus/ui/Navbar.js";
 import "../../janus/ui/Badge.js";
 import theme from "../../janus/ui/theme.js";
 const planOptions = [ {
 value: "starter",
 label: "Starter",
 
},
 {
 value: "team",
 label: "Team",
 
},
 {
 value: "enterprise",
 label: "Enterprise",
 
},
 ];
 const navTitles = [ "Features",
 "Pricing",
 "Contact",
 ];
 class FormatDemoSite extends Component {
 constructor() {
 super();
 this.state = {
 name: "",
 plan: "starter",
 notes: "Tell us what you are building.",
 submitted: false,
 section: "Features",
 
};
 
} submit() {
 const {
 name,
 plan,
 
} = this.state;
 if (!name.trim()) {
 return;
 
} this.setState( {
 submitted: true,
 
},
 );
 const {
 onSubmit,
 
} = this.props || {
};
 onSubmit && onSubmit( {
 name: name.trim(),
 plan,
 
},
 );
 
} render() {
 const {
 name,
 plan,
 notes,
 submitted,
 section,
 
} = this.state;
 const {
 accent = "accent",
 
} = this.props || {
};
 return html`       <div         data-testid="format-demo-root"         style=${{           fontFamily: "var(--janus-font, system-ui, sans-serif)",           color: "var(--janus-text)",           background: "var(--janus-bg)",           minHeight: "100vh",         }}       >         <div           style=${{             maxWidth: "720px",             margin: "0 auto",             padding: "24px 16px 64px",           }}         >           <Navbar             label="Demo sections"             titles=${navTitles}             value=${section}             color=${accent}             onChange=${(title) => this.setState(               {                 section: title,               },             )}           />           <header             style=${{               marginBottom: "32px",               marginTop: "24px",             }}           >             <Badge color=${accent}>Live preview</Badge>             <h1               style=${{                 fontSize: "2rem",                 margin: "12px 0 8px",               }}             >Ship UI without a build step</h1>             <p               style=${{                 color: "var(--janus-text-muted)",                 margin: "0",               }}             >Compact and spaced sources must format to the same website.</p>           </header>           ${section === "Features"             ? html`                 <section                   id="features"                   style=${{                     display: "grid",                     gap: "12px",                     marginBottom: "28px",                   }}                 >${[                     "Custom Elements",                     "Tagged templates",                     "Zero bundler",                   ].map(                     (title) => html`                       <article                         style=${{                           padding: "12px 14px",                           border: "1px solid var(--janus-border)",                           borderRadius: "var(--janus-radius)",                           background: "var(--janus-surface)",                         }}                       >                         <h2                           style=${{                             fontSize: "1.1rem",                             margin: "0 0 4px",                           }}                         >${title}</h2>                         <p                           style=${{                             margin: "0",                             color: "var(--janus-text-muted)",                           }}                         >Works the same before and after ${" "} format.</p>                       </article>                     `,                   )}</section>               `             : ""}           ${section === "Pricing"             ? html`                 <section id="pricing">                   <p data-testid="demo-pricing">Starter is free. Team and Enterprise scale with you.</p>                 </section>               `             : ""}           ${section === "Contact"             ? html`                 <section id="contact">                   <h2>Contact</h2>                   ${submitted                     ? html`                         <p                           data-testid="demo-success"                           style=${{                             color: "var(--janus-success, #3a3)",                           }}                         >Thanks ${" "}${name.trim()} ! Plan: ${" "}${plan} .</p>                       `                     : html`                         <form                           data-testid="demo-form"                           onSubmit=${(event) => {                             event.preventDefault();                             this.submit();                           }}                         >                           <Field label="Name">                             <input                               name="name"                               style=${theme.field()}                               value=${name}                               onInput=${(event) => this.setState(                                 {                                   name: event.target.value,                                 },                               )}                             />                           </Field>                           <Field label="Plan">                             <Select                               aria-label="Plan"                               options=${planOptions}                               value=${plan}                               onChange=${(selected) => this.setState(                                 {                                   plan: selected?.value || selected,                                 },                               )}                             />                           </Field>                           <Field label="Notes">                             <Textarea                               ${false                                 ? {                                     disabled: "disabled",                                   }                                 : {}}                             >${notes}</Textarea>                           </Field>                           <Button                             type="submit"                             color=${accent}                             ${!name.trim()                               ? {                                   disabled: "disabled",                                 }                               : {}}                           >Send ${" "} message</Button>                         </form>                       `}                 </section>               `             : ""}         </div>       </div>     `;
 
} 
} Component.register(FormatDemoSite);
 export default FormatDemoSite;
