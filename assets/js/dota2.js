(() => {
  const root = document.querySelector("[data-dota-profile]");
  if (!root) return;

  const accountId = "437094181";
  const fallbackUrl = "/assets/data/dota2-profile.json";
  const playerUrl = `https://api.opendota.com/api/players/${accountId}`;
  const heroesUrl = `https://api.opendota.com/api/players/${accountId}/heroes`;
  const recentMatchesUrl = `https://api.opendota.com/api/players/${accountId}/recentMatches`;
  const allHeroesUrl = "https://api.opendota.com/api/heroes";
  const heroMeta = {
    2: { name: "Axe", slug: "axe" },
    26: { name: "Lion", slug: "lion" },
    27: { name: "Shadow Shaman", slug: "shadow_shaman" },
    31: { name: "Lich", slug: "lich" },
    37: { name: "Warlock", slug: "warlock" },
    51: { name: "Clockwerk", slug: "rattletrap" },
    64: { name: "Jakiro", slug: "jakiro" },
    84: { name: "Ogre Magi", slug: "ogre_magi" },
    86: { name: "Rubick", slug: "rubick" },
    123: { name: "Hoodwink", slug: "hoodwink" }
  };

  const rankNames = {
    1: "Herald",
    2: "Guardian",
    3: "Crusader",
    4: "Archon",
    5: "Legend",
    6: "Ancient",
    7: "Divine",
    8: "Immortal"
  };

  function rankLabel(rankTier) {
    if (!rankTier) return "Unranked or hidden";
    const tier = Math.floor(rankTier / 10);
    const star = rankTier % 10;
    const numerals = ["", "I", "II", "III", "IV", "V"];
    return `${rankNames[tier] || "Rank"} ${numerals[star] || star}`.trim();
  }

  function winRate(hero) {
    if (!hero.games) return "0.0%";
    return `${((hero.wins / hero.games) * 100).toFixed(1)}%`;
  }

  function heroImage(slug) {
    return slug
      ? `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`
      : "";
  }

  function metaForHero(heroId, allHeroes = []) {
    const local = heroMeta[heroId];
    if (local) return local;
    const match = allHeroes.find((hero) => hero.id === Number(heroId));
    if (!match) return { name: `Hero ${heroId}`, slug: "" };
    return {
      name: match.localized_name || `Hero ${heroId}`,
      slug: match.name ? match.name.replace("npc_dota_hero_", "") : ""
    };
  }

  function matchWon(match) {
    const playedRadiant = match.player_slot < 128;
    return Boolean(match.radiant_win) === playedRadiant;
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return "Duration hidden";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }

  function formatStartTime(startTime) {
    if (!Number.isFinite(startTime)) return "Recent";
    const date = new Date(startTime * 1000);
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric"
    }).format(date);
  }

  function normalizeRecentMatches(matches = [], allHeroes = []) {
    return matches.slice(0, 10).map((match) => {
      const meta = match.slug
        ? { name: match.name, slug: match.slug }
        : metaForHero(match.hero_id || match.heroId, allHeroes);
      const won = typeof match.won === "boolean" ? match.won : matchWon(match);
      const startTime = typeof match.startTime === "number" ? match.startTime : match.start_time;
      return {
        matchId: match.match_id || match.matchId,
        heroId: match.hero_id || match.heroId,
        name: meta.name || match.name || `Hero ${match.hero_id || match.heroId}`,
        slug: meta.slug || match.slug || "",
        image: heroImage(meta.slug || match.slug),
        won,
        kills: match.kills ?? 0,
        deaths: match.deaths ?? 0,
        assists: match.assists ?? 0,
        duration: match.duration,
        startTime
      };
    });
  }

  function normalizeFallback(data) {
    return {
      personaName: data.personaName,
      avatar: "",
      rankTier: data.rankTier,
      rankLabel: data.rankLabel,
      computedMmr: data.computedMmr,
      source: data.source,
      recentMatches: normalizeRecentMatches(data.recentMatches || []),
      topHeroes: data.topHeroes.map((hero) => ({
        ...hero,
        image: heroImage(hero.slug)
      }))
    };
  }

  function normalizeLive(player, heroes, recentMatches, allHeroes) {
    return {
      personaName: player.profile?.personaname || "Edward-",
      avatar: player.profile?.avatarfull || "",
      rankTier: player.rank_tier,
      rankLabel: rankLabel(player.rank_tier),
      computedMmr: player.computed_mmr ? Math.round(player.computed_mmr) : null,
      source: "OpenDota public API",
      recentMatches: normalizeRecentMatches(recentMatches, allHeroes),
      topHeroes: heroes.slice(0, 6).map((hero) => {
        const meta = metaForHero(hero.hero_id, allHeroes);
        return {
          heroId: hero.hero_id,
          name: meta.name,
          slug: meta.slug,
          image: heroImage(meta.slug),
          games: hero.games,
          wins: hero.win
        };
      })
    };
  }

  function renderRecentMatches(matches = []) {
    const list = root.querySelector("[data-dota-recent-matches]");
    const summary = root.querySelector("[data-dota-recent-summary]");
    if (!list || !summary) return;

    const wins = matches.filter((match) => match.won).length;
    summary.textContent = matches.length ? `${wins}-${matches.length - wins}` : "No recent data";

    if (!matches.length) {
      list.innerHTML = `
        <article class="recent-match is-loading">
          <span>No recent matches available</span>
        </article>
      `;
      return;
    }

    list.innerHTML = matches.map((match) => `
      <article class="recent-match ${match.won ? "is-win" : "is-loss"}">
        ${match.image ? `<img src="${match.image}" alt="${match.name} hero portrait">` : ""}
        <div>
          <span>${match.won ? "Win" : "Loss"}</span>
          <strong>${match.kills} K · ${match.deaths} D · ${match.assists} A</strong>
        </div>
        <time>${formatDuration(match.duration)} · ${formatStartTime(match.startTime)}</time>
      </article>
    `).join("");
  }

  function render(data, live) {
    const avatar = root.querySelector("[data-dota-avatar]");
    const name = root.querySelector("[data-dota-name]");
    const rank = root.querySelector("[data-dota-rank]");
    const mmr = root.querySelector("[data-dota-mmr]");
    const source = root.querySelector("[data-dota-source]");
    const heroes = root.querySelector("[data-dota-heroes]");

    if (avatar) {
      avatar.hidden = true;
      avatar.style.display = "none";
    }

    if (avatar && data.avatar) {
      avatar.onload = () => {
        avatar.hidden = false;
        avatar.style.display = "";
      };
      avatar.onerror = () => {
        avatar.hidden = true;
        avatar.style.display = "none";
      };
      avatar.src = data.avatar;
    }

    name.textContent = data.personaName;
    rank.textContent = data.rankLabel || rankLabel(data.rankTier);
    mmr.textContent = data.computedMmr ? `${data.computedMmr} estimated MMR` : "MMR hidden";
    source.textContent = live
      ? `Live update from ${data.source}`
      : `Fallback snapshot from ${data.source}`;

    heroes.innerHTML = data.topHeroes.map((hero, index) => `
      <article class="hero-stat">
        ${hero.image ? `<img src="${hero.image}" alt="${hero.name} hero portrait">` : ""}
        <span>#${index + 1}</span>
        <strong>${hero.name}</strong>
        <div>${hero.games} games</div>
        <small>${hero.wins} wins &middot; ${winRate(hero)} win rate</small>
      </article>
    `).join("");

    renderRecentMatches(data.recentMatches);
  }

  async function loadDotaData() {
    const fallback = await fetch(fallbackUrl).then((response) => response.json());
    render(normalizeFallback(fallback), false);

    try {
      const [playerResponse, heroesResponse, recentResponse, allHeroesResponse] = await Promise.all([
        fetch(playerUrl),
        fetch(heroesUrl),
        fetch(recentMatchesUrl),
        fetch(allHeroesUrl)
      ]);
      if (!playerResponse.ok || !heroesResponse.ok || !recentResponse.ok || !allHeroesResponse.ok) {
        throw new Error("OpenDota unavailable");
      }
      const [player, heroes, recentMatches, allHeroes] = await Promise.all([
        playerResponse.json(),
        heroesResponse.json(),
        recentResponse.json(),
        allHeroesResponse.json()
      ]);
      render(normalizeLive(player, heroes, recentMatches, allHeroes), true);
    } catch {
      render(normalizeFallback(fallback), false);
    }
  }

  loadDotaData();
})();
