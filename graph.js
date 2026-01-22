import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// ---------- Data in EXACT legend order (as in your screenshot) ----------
const data = [{
        name: "Early contributors",
        value: 20,
        color: "#7C3AED"
    },
    {
        name: "Liquidity",
        value: 17.5,
        color: "#0D8B87"
    },
    {
        name: "LP Rewards",
        value: 10,
        color: "#EF4444"
    },
    {
        name: "Marketing",
        value: 7.5,
        color: "#6CD84A"
    },
    {
        name: "Casino Treasury",
        value: 20,
        color: "#2EA3FF"
    },
    {
        name: "Development Team",
        value: 10,
        color: "#FF7EB8"
    },
    {
        name: "Casino Rewards",
        value: 10,
        color: "#FFF4B0"
    },
    {
        name: "Token Sale",
        value: 5,
        color: "#FACC15"
    },
];

const totalSupply = 84098401;

// ---------- Responsive SVG via viewBox ----------
const VB_W = 900;
const VB_H = 700;

const root = d3.select("#chart");
root.selectAll("*").remove();

const svg = root.append("svg")
    .attr("viewBox", `0 0 ${VB_W} ${VB_H}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("class", "w-full h-full"); // fills aspect box

// center moved up a bit to fit legend below outside SVG
const cx = VB_W / 2;
const cy = VB_H / 2 - 20;

// ---------- Geometry ----------
const outerR = 250;
const innerR = 165;

const hoverOuterPlus = 18;
const othersOuterMinus = 10;

const padAngle = 0.03;
const cornerRadius = 10;

const g = svg.append("g").attr("transform", `translate(${cx},${cy})`);

const pie = d3.pie()
    .sort(null)
    .value(d => d.value)
    .padAngle(padAngle);

const arcBase = d3.arc()
    .innerRadius(innerR)
    .outerRadius(outerR)
    .cornerRadius(cornerRadius);

const arcHover = d3.arc()
    .innerRadius(innerR)
    .outerRadius(outerR + hoverOuterPlus)
    .cornerRadius(cornerRadius);

const arcOther = d3.arc()
    .innerRadius(innerR)
    .outerRadius(outerR - othersOuterMinus)
    .cornerRadius(cornerRadius);

const arcs = pie(data);

// ---------- Draw slices ----------
const paths = g.append("g")
    .selectAll("path")
    .data(arcs)
    .join("path")
    .attr("fill", d => d.data.color)
    .attr("d", arcBase);

// ---------- Percent labels outside ----------
const labelR = outerR + 26;
const labelArc = d3.arc().innerRadius(labelR).outerRadius(labelR);

g.append("g")
    .selectAll("text")
    .data(arcs)
    .join("text")
    .attr("class", "fill-zinc-500 text-[12px]")
    .attr("text-anchor", d => (labelArc.centroid(d)[0] >= 0 ? "start" : "end"))
    .attr("transform", d => {
        const [x, y] = labelArc.centroid(d);
        const nudge = 8;
        return `translate(${x + (x >= 0 ? nudge : -nudge)},${y})`;
    })
    .text(d => `${String(d.data.value).replace(".", ",")}%`);

// ---------- Center text ----------
g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 6)
    .attr("class", "fill-zinc-100 font-extrabold")
    .attr("style", "font-size: 32px; letter-spacing: .02em;")
    .text(new Intl.NumberFormat("ru-RU").format(totalSupply));

g.append("text")
    .attr("text-anchor", "middle")
    .attr("y", 30)
    .attr("class", "fill-foreground-muted")
    .attr("style", "font-size: 18px;")
    .text("Total Supply");

// ---------- Legend (Tailwind-styled, uneven widths, fixed order = data order) ----------
const legend = d3.select("#legend");
legend.selectAll("*").remove();

const li = legend.selectAll("div")
    .data(data)
    .join("div")
    .attr("class", "inline-flex items-center gap-2"); // uneven width by content

li.append("span")
    .attr("class", "h-3 w-3 rounded-[3px]")
    .style("background", d => d.color);

li.append("span")
    .attr("class", "leading-none")
    .text(d => d.name);

// ---------- Tooltip ----------
const tt = document.getElementById("tt");
const ttText = document.getElementById("ttText");
const ttDot = document.getElementById("ttDot");

function showTooltip(e, d) {
    ttDot.style.background = d.data.color;
    ttText.textContent = `${d.data.name} ${String(d.data.value).replace(".", ",")}%`;
    tt.style.opacity = "1";
    moveTooltip(e);
}

function moveTooltip(e) {
    tt.style.left = e.clientX + "px";
    tt.style.top = e.clientY + "px";
}

function hideTooltip() {
    tt.style.opacity = "0";
}

// ---------- Animation smoothness controls ----------
const HOVER_MS = 1320; // duration
const OUT_MS = 260;
const EASE_IN = d3.easeCubicOut; // try: easeBackOut, easeExpOut, easeSinOut
const EASE_OUT = d3.easeCubicOut;

// init for tweening
paths.each(function (d) {
    this._current = d;
});

function arcTween(arcGen) {
    return function (d) {
        const i = d3.interpolate(this._current, d);
        this._current = i(1);
        return t => arcGen(i(t));
    };
}

paths
    .on("pointerenter", function (e, activeD) {
        showTooltip(e, activeD);

        paths.interrupt().transition()
            .duration(HOVER_MS)
            .ease(EASE_IN)
            .attrTween("d", function (d) {
                return arcTween(d === activeD ? arcHover : arcOther).call(this, d);
            });
    })
    .on("pointermove", (e) => moveTooltip(e))
    .on("pointerleave", function () {
        hideTooltip();

        paths.interrupt().transition()
            .duration(OUT_MS)
            .ease(EASE_OUT)
            .attrTween("d", function (d) {
                return arcTween(arcBase).call(this, d);
            });
    });