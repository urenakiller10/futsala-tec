import { useEffect, useMemo, useState } from 'react';
import { initialData } from './data/initialData';
import futsalaTecShield from './assets/futsala tec.jpeg';

const STORAGE_KEY = 'torneo-futsala-tec-data';
const ADMIN_PASSWORD = 'J123';

const MOBILE_INITIAL_MATCHES = 2;
const MOBILE_MATCHES_STEP = 3;

const MOBILE_INITIAL_GROUPS = 2;
const MOBILE_GROUPS_STEP = 2;

function App() {
  const [category, setCategory] = useState('masculino');
  const [isAdmin, setIsAdmin] = useState(false);

  const [upcomingGroupFilter, setUpcomingGroupFilter] =
    useState('all');

  const [playedGroupFilter, setPlayedGroupFilter] =
    useState('all');

  const [isAdminLoginOpen, setIsAdminLoginOpen] =
    useState(false);

  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const [isMobileNavOpen, setIsMobileNavOpen] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState('inicio');

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 768px)').matches;
  });

  const [
    visibleUpcomingMatches,
    setVisibleUpcomingMatches,
  ] = useState(MOBILE_INITIAL_MATCHES);

  const [
    visiblePlayedMatches,
    setVisiblePlayedMatches,
  ] = useState(MOBILE_INITIAL_MATCHES);

  const [
    visibleStandingsGroups,
    setVisibleStandingsGroups,
  ] = useState(MOBILE_INITIAL_GROUPS);

  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    return initialData;
  });

  const currentTournament = data[category];

  const mobileNavigationItems = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: '↑',
    },
    {
      id: 'proximos',
      label: 'Próximos',
      icon: 'P',
    },
    {
      id: 'jugados',
      label: 'Jugados',
      icon: 'J',
    },
    {
      id: 'posiciones',
      label: 'Posiciones',
      icon: 'T',
    },
    {
      id: 'goleadores',
      label: 'Goleadores',
      icon: 'G',
    },
    ...(category === 'masculino'
      ? [
          {
            id: 'eliminatorias',
            label: 'Eliminatorias',
            icon: 'E',
          },
        ]
      : []),
  ];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const mobileMediaQuery = window.matchMedia(
      '(max-width: 768px)',
    );

    function handleMobileChange(event) {
      setIsMobile(event.matches);
    }

    setIsMobile(mobileMediaQuery.matches);

    mobileMediaQuery.addEventListener(
      'change',
      handleMobileChange,
    );

    return () => {
      mobileMediaQuery.removeEventListener(
        'change',
        handleMobileChange,
      );
    };
  }, []);

  useEffect(() => {
    setUpcomingGroupFilter('all');
    setPlayedGroupFilter('all');
    setIsMobileNavOpen(false);

    setVisibleUpcomingMatches(MOBILE_INITIAL_MATCHES);
    setVisiblePlayedMatches(MOBILE_INITIAL_MATCHES);
    setVisibleStandingsGroups(MOBILE_INITIAL_GROUPS);
  }, [category]);

  useEffect(() => {
    setVisibleUpcomingMatches(MOBILE_INITIAL_MATCHES);
  }, [upcomingGroupFilter]);

  useEffect(() => {
    setVisiblePlayedMatches(MOBILE_INITIAL_MATCHES);
  }, [playedGroupFilter]);

  useEffect(() => {
    const sectionIds = [
      'inicio',
      'proximos',
      'jugados',
      'posiciones',
      'goleadores',
      'eliminatorias',
    ];

    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (firstEntry, secondEntry) =>
              secondEntry.intersectionRatio -
              firstEntry.intersectionRatio,
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: '-28% 0px -58% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });

      observer.disconnect();
    };
  }, [category, isAdmin]);

  const groups = useMemo(() => {
    const groupNames = currentTournament.teams
      .map((team) => team.group)
      .filter(Boolean);

    return [...new Set(groupNames)].sort();
  }, [currentTournament.teams]);

  const displayedStandingsGroups =
    isMobile && category === 'masculino'
      ? groups.slice(0, visibleStandingsGroups)
      : groups;

  const remainingStandingsGroups = Math.max(
    groups.length - visibleStandingsGroups,
    0,
  );

  const upcomingMatches = useMemo(() => {
    const filteredMatches =
      currentTournament.matches.filter((match) => {
        if (match.played) {
          return false;
        }

        if (
          category !== 'masculino' ||
          upcomingGroupFilter === 'all'
        ) {
          return true;
        }

        return match.group === upcomingGroupFilter;
      });

    return [...filteredMatches].sort(
      (firstMatch, secondMatch) =>
        compareMatchesByDate(
          firstMatch,
          secondMatch,
          'ascending',
        ),
    );
  }, [
    currentTournament.matches,
    category,
    upcomingGroupFilter,
  ]);

  const playedMatches = useMemo(() => {
    const filteredMatches =
      currentTournament.matches.filter((match) => {
        if (!match.played) {
          return false;
        }

        if (
          category !== 'masculino' ||
          playedGroupFilter === 'all'
        ) {
          return true;
        }

        return match.group === playedGroupFilter;
      });

    return [...filteredMatches].sort(
      (firstMatch, secondMatch) =>
        compareMatchesByDate(
          firstMatch,
          secondMatch,
          'descending',
        ),
    );
  }, [
    currentTournament.matches,
    category,
    playedGroupFilter,
  ]);

  const displayedUpcomingMatches = isMobile
    ? upcomingMatches.slice(0, visibleUpcomingMatches)
    : upcomingMatches;

  const displayedPlayedMatches = isMobile
    ? playedMatches.slice(0, visiblePlayedMatches)
    : playedMatches;

  const remainingUpcomingMatches = Math.max(
    upcomingMatches.length - visibleUpcomingMatches,
    0,
  );

  const remainingPlayedMatches = Math.max(
    playedMatches.length - visiblePlayedMatches,
    0,
  );

  const standings = useMemo(() => {
    return calculateStandings(
      currentTournament.teams,
      currentTournament.matches,
    );
  }, [currentTournament.teams, currentTournament.matches]);

  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    setActiveSection(sectionId);
    setIsMobileNavOpen(false);

    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function updateTournament(updatedTournament) {
    setData((previousData) => ({
      ...previousData,
      [category]: updatedTournament,
    }));
  }

  function changeCategory(newCategory) {
    setCategory(newCategory);

    setUpcomingGroupFilter('all');
    setPlayedGroupFilter('all');

    setVisibleUpcomingMatches(MOBILE_INITIAL_MATCHES);
    setVisiblePlayedMatches(MOBILE_INITIAL_MATCHES);
    setVisibleStandingsGroups(MOBILE_INITIAL_GROUPS);

    setActiveSection('inicio');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function showMoreUpcomingMatches() {
    setVisibleUpcomingMatches(
      (previousAmount) =>
        previousAmount + MOBILE_MATCHES_STEP,
    );
  }

  function showLessUpcomingMatches() {
    setVisibleUpcomingMatches(MOBILE_INITIAL_MATCHES);

    const section = document.getElementById('proximos');

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  function showMorePlayedMatches() {
    setVisiblePlayedMatches(
      (previousAmount) =>
        previousAmount + MOBILE_MATCHES_STEP,
    );
  }

  function showLessPlayedMatches() {
    setVisiblePlayedMatches(MOBILE_INITIAL_MATCHES);

    const section = document.getElementById('jugados');

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  function showMoreStandingsGroups() {
    setVisibleStandingsGroups(
      (previousAmount) =>
        previousAmount + MOBILE_GROUPS_STEP,
    );
  }

  function showLessStandingsGroups() {
    setVisibleStandingsGroups(MOBILE_INITIAL_GROUPS);

    const section = document.getElementById('posiciones');

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  function openAdminLogin() {
    if (isAdmin) {
      setIsAdmin(false);
      setAdminPassword('');
      setAdminError('');
      return;
    }

    setIsAdminLoginOpen(true);
    setAdminPassword('');
    setAdminError('');
  }

  function closeAdminLogin() {
    setIsAdminLoginOpen(false);
    setAdminPassword('');
    setAdminError('');
  }

  function loginAsAdmin(event) {
    event.preventDefault();

    if (adminPassword !== ADMIN_PASSWORD) {
      setAdminError(
        'La contraseña ingresada es incorrecta.',
      );

      return;
    }

    setIsAdmin(true);
    setIsAdminLoginOpen(false);
    setAdminPassword('');
    setAdminError('');
  }

  function addTeam(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = String(
      formData.get('teamName') || '',
    ).trim();

    const group = String(
      formData.get('teamGroup') || '',
    )
      .trim()
      .toUpperCase();

    if (!name) {
      return;
    }

    const newTeam = {
      id: Date.now(),
      name,
      group: category === 'masculino' ? group || 'A' : '',
    };

    updateTournament({
      ...currentTournament,
      teams: [...currentTournament.teams, newTeam],
    });

    event.currentTarget.reset();
  }

  function deleteTeam(teamId) {
    const teamToDelete = currentTournament.teams.find(
      (team) => team.id === teamId,
    );

    if (!teamToDelete) {
      return;
    }

    updateTournament({
      ...currentTournament,

      teams: currentTournament.teams.filter(
        (team) => team.id !== teamId,
      ),

      matches: currentTournament.matches.filter(
        (match) =>
          match.homeTeam !== teamToDelete.name &&
          match.awayTeam !== teamToDelete.name,
      ),

      scorers: currentTournament.scorers.filter(
        (scorer) => scorer.team !== teamToDelete.name,
      ),
    });
  }

  function addMatch(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const homeTeam = String(
      formData.get('homeTeam') || '',
    );

    const awayTeam = String(
      formData.get('awayTeam') || '',
    );

    const date = String(formData.get('date') || '');

    const time = String(
      formData.get('time') || '',
    ).trim();

    const week = String(
      formData.get('week') || '',
    ).trim();

    const phase = String(
      formData.get('phase') || '',
    ).trim();

    const manuallySelectedGroup = String(
      formData.get('group') || '',
    )
      .trim()
      .toUpperCase();

    if (
      !homeTeam ||
      !awayTeam ||
      homeTeam === awayTeam
    ) {
      return;
    }

    const homeTeamData = currentTournament.teams.find(
      (team) => team.name === homeTeam,
    );

    const awayTeamData = currentTournament.teams.find(
      (team) => team.name === awayTeam,
    );

    let matchGroup = '';

    if (category === 'masculino') {
      if (
        homeTeamData?.group &&
        homeTeamData.group === awayTeamData?.group
      ) {
        matchGroup = homeTeamData.group;
      } else {
        matchGroup = manuallySelectedGroup;
      }
    }

    const newMatch = {
      id: Date.now(),

      phase:
        phase ||
        (category === 'masculino'
          ? 'Grupos'
          : 'Todos contra todos'),

      week: week || 'Semana por definir',
      group: matchGroup,
      homeTeam,
      awayTeam,
      date,
      time: time || 'Hora por definir',
      played: false,
      homeScore: '',
      awayScore: '',
    };

    updateTournament({
      ...currentTournament,
      matches: [
        ...currentTournament.matches,
        newMatch,
      ],
    });

    event.currentTarget.reset();
  }

  function updateMatch(matchId, field, value) {
    const updatedMatches =
      currentTournament.matches.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

        return {
          ...match,
          [field]: value,
        };
      });

    updateTournament({
      ...currentTournament,
      matches: updatedMatches,
    });
  }

  function saveResult(matchId) {
    const updatedMatches =
      currentTournament.matches.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

        if (
          match.homeScore === '' ||
          match.awayScore === ''
        ) {
          return match;
        }

        const homeScore = Number(match.homeScore);
        const awayScore = Number(match.awayScore);

        if (
          Number.isNaN(homeScore) ||
          Number.isNaN(awayScore) ||
          homeScore < 0 ||
          awayScore < 0
        ) {
          return match;
        }

        return {
          ...match,
          homeScore,
          awayScore,
          played: true,
        };
      });

    updateTournament({
      ...currentTournament,
      matches: updatedMatches,
    });
  }

  function markAsPending(matchId) {
    const updatedMatches =
      currentTournament.matches.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

        return {
          ...match,
          played: false,
          homeScore: '',
          awayScore: '',
        };
      });

    updateTournament({
      ...currentTournament,
      matches: updatedMatches,
    });
  }

  function deleteMatch(matchId) {
    updateTournament({
      ...currentTournament,

      matches: currentTournament.matches.filter(
        (match) => match.id !== matchId,
      ),
    });
  }

  function addScorer(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = String(
      formData.get('scorerName') || '',
    ).trim();

    const team = String(
      formData.get('scorerTeam') || '',
    );

    const goals = Number(formData.get('goals'));

    if (
      !name ||
      !team ||
      Number.isNaN(goals) ||
      goals < 1
    ) {
      return;
    }

    const existingScorer =
      currentTournament.scorers.find(
        (scorer) =>
          scorer.name.toLowerCase() ===
            name.toLowerCase() &&
          scorer.team === team,
      );

    let updatedScorers;

    if (existingScorer) {
      updatedScorers =
        currentTournament.scorers.map((scorer) => {
          if (scorer.id !== existingScorer.id) {
            return scorer;
          }

          return {
            ...scorer,
            goals: scorer.goals + goals,
          };
        });
    } else {
      updatedScorers = [
        ...currentTournament.scorers,
        {
          id: Date.now(),
          name,
          team,
          goals,
        },
      ];
    }

    updateTournament({
      ...currentTournament,
      scorers: updatedScorers,
    });

    event.currentTarget.reset();
  }

  function deleteScorer(scorerId) {
    updateTournament({
      ...currentTournament,

      scorers: currentTournament.scorers.filter(
        (scorer) => scorer.id !== scorerId,
      ),
    });
  }

  function resetData() {
    const confirmReset = window.confirm(
      '¿Seguro que desea reiniciar todos los datos del torneo?',
    );

    if (!confirmReset) {
      return;
    }

    setData(initialData);
    localStorage.removeItem(STORAGE_KEY);

    setUpcomingGroupFilter('all');
    setPlayedGroupFilter('all');

    setVisibleUpcomingMatches(MOBILE_INITIAL_MATCHES);
    setVisiblePlayedMatches(MOBILE_INITIAL_MATCHES);
    setVisibleStandingsGroups(MOBILE_INITIAL_GROUPS);
  }

  return (
    <main className="app">
      <section className="hero" id="inicio">
        <div className="hero__content">
          <p className="hero__eyebrow">
            Tecnológico de Costa Rica
          </p>

          <div className="hero__title-row">
            <img
              className="hero__shield"
              src={futsalaTecShield}
              alt="Escudo de Futsala TEC"
            />

            <h1 className="hero__title">
              Torneo Interno de Futsala TEC
            </h1>
          </div>

          <p className="hero__text">
            Consulte partidos, resultados, tablas de
            posiciones y goleadores del torneo interno.
          </p>

          <div className="hero__actions">
            <button
              className={`category-button ${
                category === 'masculino' ? 'active' : ''
              }`}
              type="button"
              onClick={() =>
                changeCategory('masculino')
              }
            >
              Masculino
            </button>

            <button
              className={`category-button ${
                category === 'femenino' ? 'active' : ''
              }`}
              type="button"
              onClick={() => changeCategory('femenino')}
            >
              Femenino
            </button>
          </div>
        </div>
      </section>

      <section className="tournament-header">
        <div>
          <h2>{currentTournament.title}</h2>
          <p>{currentTournament.format}</p>
        </div>

        <div className="tournament-header__stats">
          <article>
            <strong>
              {currentTournament.teams.length}
            </strong>

            <span>Equipos</span>
          </article>

          <article>
            <strong>
              {currentTournament.matches.length}
            </strong>

            <span>Partidos</span>
          </article>

          <article>
            <strong>
              {currentTournament.scorers.length}
            </strong>

            <span>Goleadores</span>
          </article>
        </div>
      </section>

      {isAdmin && (
        <section className="admin-panel">
          <div className="section-title">
            <p>Panel rápido</p>
            <h2>Administrar torneo</h2>
          </div>

          <div className="admin-grid">
            <form
              className="admin-form"
              onSubmit={addTeam}
            >
              <h3>Agregar equipo</h3>

              <label>
                Nombre del equipo

                <input
                  name="teamName"
                  type="text"
                  placeholder="Ej: Civil FC"
                />
              </label>

              {category === 'masculino' && (
                <label>
                  Grupo

                  <input
                    name="teamGroup"
                    type="text"
                    placeholder="Ej: A"
                    maxLength="1"
                  />
                </label>
              )}

              <button type="submit">
                Agregar equipo
              </button>
            </form>

            <form
              className="admin-form"
              onSubmit={addMatch}
            >
              <h3>Agregar partido</h3>

              <div className="form-row">
                <label>
                  Local

                  <select
                    name="homeTeam"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Seleccione
                    </option>

                    {currentTournament.teams.map(
                      (team) => (
                        <option
                          key={team.id}
                          value={team.name}
                        >
                          {team.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Visitante

                  <select
                    name="awayTeam"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Seleccione
                    </option>

                    {currentTournament.teams.map(
                      (team) => (
                        <option
                          key={team.id}
                          value={team.name}
                        >
                          {team.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  Semana o jornada

                  <input
                    name="week"
                    type="text"
                    placeholder="Ej: Semana 3"
                  />
                </label>

                <label>
                  Fecha

                  <input
                    name="date"
                    type="date"
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Hora

                  <input
                    name="time"
                    type="text"
                    placeholder="Ej: 11:30 a.m."
                  />
                </label>

                <label>
                  Fase

                  <input
                    name="phase"
                    type="text"
                    placeholder={
                      category === 'masculino'
                        ? 'Grupos'
                        : 'Todos contra todos'
                    }
                  />
                </label>
              </div>

              {category === 'masculino' && (
                <label>
                  Grupo

                  <input
                    name="group"
                    type="text"
                    placeholder="Ej: A"
                    maxLength="1"
                  />
                </label>
              )}

              <button type="submit">
                Agregar partido
              </button>
            </form>

            <form
              className="admin-form"
              onSubmit={addScorer}
            >
              <h3>Agregar goles</h3>

              <label>
                Nombre del jugador

                <input
                  name="scorerName"
                  type="text"
                  placeholder="Ej: Carlos Mora"
                />
              </label>

              <label>
                Equipo

                <select
                  name="scorerTeam"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Seleccione
                  </option>

                  {currentTournament.teams.map(
                    (team) => (
                      <option
                        key={team.id}
                        value={team.name}
                      >
                        {team.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Goles

                <input
                  name="goals"
                  type="number"
                  min="1"
                  placeholder="1"
                />
              </label>

              <button type="submit">
                Agregar goles
              </button>
            </form>
          </div>

          <div className="admin-list">
            <h3>Equipos registrados</h3>

            <div className="team-chips">
              {currentTournament.teams.map((team) => (
                <span
                  className="team-chip"
                  key={team.id}
                >
                  {team.name}

                  {team.group && (
                    <small>
                      Grupo {team.group}
                    </small>
                  )}

                  <button
                    type="button"
                    aria-label={`Eliminar ${team.name}`}
                    onClick={() =>
                      deleteTeam(team.id)
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            className="reset-button"
            type="button"
            onClick={resetData}
          >
            Reiniciar datos
          </button>
        </section>
      )}

      <section className="content-grid">
        <section
          className="card navigation-section"
          id="proximos"
        >
          <div className="section-header">
            <div className="section-title">
              <p>Calendario</p>
              <h2>Próximos partidos</h2>
            </div>

            {category === 'masculino' &&
              groups.length > 0 && (
                <label className="group-filter">
                  <span>Grupo</span>

                  <select
                    value={upcomingGroupFilter}
                    onChange={(event) =>
                      setUpcomingGroupFilter(
                        event.target.value,
                      )
                    }
                  >
                    <option value="all">
                      Todos
                    </option>

                    {groups.map((group) => (
                      <option
                        key={group}
                        value={group}
                      >
                        Grupo {group}
                      </option>
                    ))}
                  </select>
                </label>
              )}
          </div>

          <div className="match-list">
            {upcomingMatches.length === 0 && (
              <p className="empty-message">
                {upcomingGroupFilter === 'all'
                  ? 'No hay partidos próximos.'
                  : `No hay partidos próximos del grupo ${upcomingGroupFilter}.`}
              </p>
            )}

            {displayedUpcomingMatches.map(
              (match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isAdmin={isAdmin}
                  onUpdate={updateMatch}
                  onSave={saveResult}
                  onPending={markAsPending}
                  onDelete={deleteMatch}
                />
              ),
            )}

            {isMobile &&
              upcomingMatches.length >
                MOBILE_INITIAL_MATCHES && (
                <div className="match-list__actions">
                  {remainingUpcomingMatches > 0 ? (
                    <button
                      className="show-more-button"
                      type="button"
                      onClick={
                        showMoreUpcomingMatches
                      }
                    >
                      Ver{' '}
                      {Math.min(
                        MOBILE_MATCHES_STEP,
                        remainingUpcomingMatches,
                      )}{' '}
                      más
                    </button>
                  ) : (
                    <button
                      className="show-more-button"
                      type="button"
                      onClick={
                        showLessUpcomingMatches
                      }
                    >
                      Ver menos
                    </button>
                  )}
                </div>
              )}
          </div>
        </section>

        <section
          className="card navigation-section"
          id="jugados"
        >
          <div className="section-header">
            <div className="section-title">
              <p>Resultados</p>
              <h2>Partidos jugados</h2>
            </div>

            {category === 'masculino' &&
              groups.length > 0 && (
                <label className="group-filter">
                  <span>Grupo</span>

                  <select
                    value={playedGroupFilter}
                    onChange={(event) =>
                      setPlayedGroupFilter(
                        event.target.value,
                      )
                    }
                  >
                    <option value="all">
                      Todos
                    </option>

                    {groups.map((group) => (
                      <option
                        key={group}
                        value={group}
                      >
                        Grupo {group}
                      </option>
                    ))}
                  </select>
                </label>
              )}
          </div>

          <div className="match-list">
            {playedMatches.length === 0 && (
              <p className="empty-message">
                {playedGroupFilter === 'all'
                  ? 'Todavía no hay partidos jugados.'
                  : `Todavía no hay partidos jugados del grupo ${playedGroupFilter}.`}
              </p>
            )}

            {displayedPlayedMatches.map(
              (match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isAdmin={isAdmin}
                  onUpdate={updateMatch}
                  onSave={saveResult}
                  onPending={markAsPending}
                  onDelete={deleteMatch}
                />
              ),
            )}

            {isMobile &&
              playedMatches.length >
                MOBILE_INITIAL_MATCHES && (
                <div className="match-list__actions">
                  {remainingPlayedMatches > 0 ? (
                    <button
                      className="show-more-button"
                      type="button"
                      onClick={showMorePlayedMatches}
                    >
                      Ver{' '}
                      {Math.min(
                        MOBILE_MATCHES_STEP,
                        remainingPlayedMatches,
                      )}{' '}
                      más
                    </button>
                  ) : (
                    <button
                      className="show-more-button"
                      type="button"
                      onClick={showLessPlayedMatches}
                    >
                      Ver menos
                    </button>
                  )}
                </div>
              )}
          </div>
        </section>
      </section>

      <section className="content-grid content-grid--standings">
        <section
          className="card card--large navigation-section"
          id="posiciones"
        >
          <div className="section-title">
            <p>Clasificación</p>
            <h2>Tabla de posiciones</h2>
          </div>

          {category === 'masculino' &&
          groups.length > 0 ? (
            <>
              {displayedStandingsGroups.map((group) => (
                <div
                  className={`table-block table-block--group-${group.toLowerCase()}`}
                  key={group}
                >
                  <h3>Grupo {group}</h3>

                  <StandingsTable
                    standings={standings.filter(
                      (row) =>
                        row.team.group === group,
                    )}
                  />
                </div>
              ))}

              {isMobile &&
                groups.length >
                  MOBILE_INITIAL_GROUPS && (
                  <div className="standings-groups__actions">
                    {remainingStandingsGroups > 0 ? (
                      <button
                        className="show-more-button"
                        type="button"
                        onClick={
                          showMoreStandingsGroups
                        }
                      >
                        Ver{' '}
                        {Math.min(
                          MOBILE_GROUPS_STEP,
                          remainingStandingsGroups,
                        )}{' '}
                        {Math.min(
                          MOBILE_GROUPS_STEP,
                          remainingStandingsGroups,
                        ) === 1
                          ? 'grupo más'
                          : 'grupos más'}
                      </button>
                    ) : (
                      <button
                        className="show-more-button"
                        type="button"
                        onClick={
                          showLessStandingsGroups
                        }
                      >
                        Ver menos
                      </button>
                    )}
                  </div>
                )}
            </>
          ) : (
            <StandingsTable standings={standings} />
          )}
        </section>

        <section
          className="card navigation-section"
          id="goleadores"
        >
          <div className="section-title">
            <p>Ranking</p>
            <h2>Goleadores</h2>
          </div>

          <ScorersTable
            scorers={currentTournament.scorers}
            isAdmin={isAdmin}
            onDelete={deleteScorer}
          />
        </section>
      </section>

      {category === 'masculino' && (
        <section
          className="card navigation-section"
          id="eliminatorias"
        >
          <div className="section-title">
            <p>Fase final</p>
            <h2>Eliminatorias</h2>
          </div>

          <div className="knockout-grid">
            {currentTournament.matches
              .filter(
                (match) =>
                  match.phase.toLowerCase() !==
                  'grupos',
              )
              .map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isAdmin={isAdmin}
                  onUpdate={updateMatch}
                  onSave={saveResult}
                  onPending={markAsPending}
                  onDelete={deleteMatch}
                />
              ))}
          </div>
        </section>
      )}

      <nav
        className={`mobile-quick-nav ${
          isMobileNavOpen ? 'is-open' : ''
        }`}
        aria-label="Navegación rápida"
      >
        <div className="mobile-quick-nav__panel">
          {mobileNavigationItems.map(
            (navigationItem) => (
              <button
                className={`mobile-quick-nav__item ${
                  activeSection === navigationItem.id
                    ? 'is-active'
                    : ''
                }`}
                type="button"
                key={navigationItem.id}
                onClick={() =>
                  scrollToSection(
                    navigationItem.id,
                  )
                }
              >
                <span className="mobile-quick-nav__icon">
                  {navigationItem.icon}
                </span>

                <span className="mobile-quick-nav__label">
                  {navigationItem.label}
                </span>
              </button>
            ),
          )}
        </div>

        <button
          className="mobile-quick-nav__toggle"
          type="button"
          aria-label={
            isMobileNavOpen
              ? 'Cerrar navegación rápida'
              : 'Abrir navegación rápida'
          }
          aria-expanded={isMobileNavOpen}
          onClick={() =>
            setIsMobileNavOpen(
              (previousState) => !previousState,
            )
          }
        >
          <span aria-hidden="true">
            {isMobileNavOpen ? '×' : '☰'}
          </span>
        </button>
      </nav>

      <button
        className={`admin-access-button ${
          isAdmin ? 'is-active' : ''
        }`}
        type="button"
        title={
          isAdmin
            ? 'Salir del modo administrador'
            : 'Acceso administrativo'
        }
        aria-label={
          isAdmin
            ? 'Salir del modo administrador'
            : 'Abrir acceso administrativo'
        }
        onClick={openAdminLogin}
      >
        {isAdmin ? '×' : '⚙'}
      </button>

      {isAdminLoginOpen && (
        <div
          className="admin-login-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeAdminLogin();
            }
          }}
        >
          <form
            className="admin-login"
            onSubmit={loginAsAdmin}
          >
            <button
              className="admin-login__close"
              type="button"
              aria-label="Cerrar"
              onClick={closeAdminLogin}
            >
              ×
            </button>

            <p className="admin-login__eyebrow">
              Acceso restringido
            </p>

            <h2>Modo administrador</h2>

            <p className="admin-login__description">
              Ingrese la contraseña para administrar los
              datos del torneo.
            </p>

            <label>
              Contraseña

              <input
                type="password"
                value={adminPassword}
                autoFocus
                autoComplete="current-password"
                onChange={(event) => {
                  setAdminPassword(
                    event.target.value,
                  );

                  setAdminError('');
                }}
              />
            </label>

            {adminError && (
              <p className="admin-login__error">
                {adminError}
              </p>
            )}

            <button
              className="admin-login__submit"
              type="submit"
            >
              Entrar
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

function MatchCard({
  match,
  isAdmin,
  onUpdate,
  onSave,
  onPending,
  onDelete,
}) {
  const normalizedGroup = match.group
    ? match.group.toLowerCase()
    : 'general';

  return (
    <article
      className={`match-card match-card--group-${normalizedGroup}`}
    >
      <div className="match-card__top">
        <span className="match-card__phase">
          {match.phase}
        </span>

        {match.group && (
          <span className="match-card__group">
            Grupo {match.group}
          </span>
        )}
      </div>

      <div className="match-card__teams">
        <strong>{match.homeTeam}</strong>

        <div className="match-card__score">
          {isAdmin ? (
            <>
              <input
                type="number"
                min="0"
                value={match.homeScore}
                aria-label={`Marcador de ${match.homeTeam}`}
                onChange={(event) =>
                  onUpdate(
                    match.id,
                    'homeScore',
                    event.target.value,
                  )
                }
              />

              <span>-</span>

              <input
                type="number"
                min="0"
                value={match.awayScore}
                aria-label={`Marcador de ${match.awayTeam}`}
                onChange={(event) =>
                  onUpdate(
                    match.id,
                    'awayScore',
                    event.target.value,
                  )
                }
              />
            </>
          ) : match.played ? (
            <strong>
              {match.homeScore} - {match.awayScore}
            </strong>
          ) : (
            <strong>vs</strong>
          )}
        </div>

        <strong>{match.awayTeam}</strong>
      </div>

      <div className="match-card__footer">
        <span className="match-card__week">
          {match.week || 'Semana por definir'}
        </span>

        <span>{formatDate(match.date)}</span>

        <span>
          {match.time || 'Hora por definir'}
        </span>
      </div>

      {isAdmin && (
        <div className="match-card__admin">
          <button
            type="button"
            onClick={() => onSave(match.id)}
          >
            Guardar resultado
          </button>

          <button
            type="button"
            onClick={() => onPending(match.id)}
          >
            Marcar pendiente
          </button>

          <button
            className="danger"
            type="button"
            onClick={() => onDelete(match.id)}
          >
            Eliminar
          </button>
        </div>
      )}
    </article>
  );
}

function StandingsTable({ standings }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>PJ</th>
            <th>PG</th>
            <th>PE</th>
            <th>PP</th>
            <th>GF</th>
            <th>GC</th>
            <th>DG</th>
            <th>PTS</th>
          </tr>
        </thead>

        <tbody>
          {standings.map((row) => (
            <tr key={row.team.id}>
              <td>{row.team.name}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.goalsFor}</td>
              <td>{row.goalsAgainst}</td>
              <td>{row.goalDifference}</td>

              <td>
                <strong>{row.points}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScorersTable({
  scorers,
  isAdmin,
  onDelete,
}) {
  const sortedScorers = [...scorers].sort(
    (firstScorer, secondScorer) =>
      secondScorer.goals - firstScorer.goals,
  );

  return (
    <div className="scorers-list">
      {sortedScorers.length === 0 && (
        <p className="empty-message">
          Todavía no hay goleadores registrados.
        </p>
      )}

      {sortedScorers.map((scorer, index) => (
        <article
          className="scorer-row"
          key={scorer.id}
        >
          <span className="scorer-row__position">
            #{index + 1}
          </span>

          <div>
            <strong>{scorer.name}</strong>
            <p>{scorer.team}</p>
          </div>

          <span className="scorer-row__goals">
            {scorer.goals}
          </span>

          {isAdmin && (
            <button
              type="button"
              aria-label={`Eliminar a ${scorer.name}`}
              onClick={() => onDelete(scorer.id)}
            >
              ×
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

function calculateStandings(teams, matches) {
  const rows = teams.map((team) => ({
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  matches
    .filter((match) => match.played)
    .forEach((match) => {
      const homeRow = rows.find(
        (row) => row.team.name === match.homeTeam,
      );

      const awayRow = rows.find(
        (row) => row.team.name === match.awayTeam,
      );

      if (!homeRow || !awayRow) {
        return;
      }

      const homeScore = Number(match.homeScore);
      const awayScore = Number(match.awayScore);

      if (
        Number.isNaN(homeScore) ||
        Number.isNaN(awayScore)
      ) {
        return;
      }

      homeRow.played += 1;
      awayRow.played += 1;

      homeRow.goalsFor += homeScore;
      homeRow.goalsAgainst += awayScore;

      awayRow.goalsFor += awayScore;
      awayRow.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        homeRow.won += 1;
        homeRow.points += 3;
        awayRow.lost += 1;
      } else if (homeScore < awayScore) {
        awayRow.won += 1;
        awayRow.points += 3;
        homeRow.lost += 1;
      } else {
        homeRow.drawn += 1;
        awayRow.drawn += 1;

        homeRow.points += 1;
        awayRow.points += 1;
      }
    });

  return rows
    .map((row) => ({
      ...row,
      goalDifference:
        row.goalsFor - row.goalsAgainst,
    }))
    .sort((firstRow, secondRow) => {
      if (secondRow.points !== firstRow.points) {
        return secondRow.points - firstRow.points;
      }

      if (
        secondRow.goalDifference !==
        firstRow.goalDifference
      ) {
        return (
          secondRow.goalDifference -
          firstRow.goalDifference
        );
      }

      return (
        secondRow.goalsFor - firstRow.goalsFor
      );
    });
}

function compareMatchesByDate(
  firstMatch,
  secondMatch,
  direction,
) {
  const firstTimestamp =
    getMatchTimestamp(firstMatch);

  const secondTimestamp =
    getMatchTimestamp(secondMatch);

  if (
    firstTimestamp === null &&
    secondTimestamp === null
  ) {
    return 0;
  }

  if (firstTimestamp === null) {
    return 1;
  }

  if (secondTimestamp === null) {
    return -1;
  }

  if (direction === 'descending') {
    return secondTimestamp - firstTimestamp;
  }

  return firstTimestamp - secondTimestamp;
}

function getMatchTimestamp(match) {
  if (!match.date) {
    return null;
  }

  const normalizedTime = normalizeMatchTime(
    match.time,
  );

  const date = new Date(
    `${match.date}T${normalizedTime}`,
  );

  const timestamp = date.getTime();

  return Number.isNaN(timestamp)
    ? null
    : timestamp;
}

function normalizeMatchTime(timeValue) {
  if (!timeValue) {
    return '00:00:00';
  }

  const normalizedValue = String(timeValue)
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s/g, '');

  const timeMatch = normalizedValue.match(
    /^(\d{1,2}):(\d{2})(am|pm)?$/,
  );

  if (!timeMatch) {
    return '00:00:00';
  }

  let hours = Number(timeMatch[1]);

  const minutes = Number(timeMatch[2]);
  const period = timeMatch[3];

  if (period === 'pm' && hours < 12) {
    hours += 12;
  }

  if (period === 'am' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(
    2,
    '0',
  )}:${String(minutes).padStart(2, '0')}:00`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Fecha por definir';
  }

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default App;