import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ExportButtons from "./components/ExportButtons";
import SettingsModal from "./components/SettingsModal";
import UpdateNotice from "./components/UpdateNotice";
import { exportToPDF, generateDrehdispoHTML, openPrintPreview } from "./utils/exportUtils";
import "./styles/print.css";
import "./styles/settings.css";
import "./styles/update-notice.css";

const API_BASE = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, "");
  // LAN/production: derive API host from the page's hostname so pre-built
  // bundles work without re-building when accessed from another device.
  const apiPort = (import.meta.env.VITE_API_PORT as string | undefined) ?? "3000";
  return `${window.location.protocol}//${window.location.hostname}:${apiPort}`;
})();
const DEMO_PROJECT_ID = import.meta.env.VITE_DEMO_PROJECT_ID as string | undefined;
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "dev";

type AppView = "dashboard" | "budget" | "expenses" | "shootDays" | "contacts" | "contracts" | "timeTracking" | "disposition";
type ProjectStatus = "pre" | "production" | "post";
type ContactCategory = "crew" | "cast" | "other";
type ContractStatus = "draft" | "active" | "expired" | "terminated";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
};

type CostCenter = {
  id: string;
  name: string;
  budget: number;
  spent: number;
};

type ShootDay = {
  id: string;
  date: string;
  location: string | null;
  locationOwner?: string | null;
  locationContactPerson?: string | null;
  notes?: string | null;
  callTime?: string | null;
  weather?: string | null;
};

type ProjectContact = {
  id: string;
  fullName: string;
  category: ContactCategory;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type ProjectAppointment = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  notes: string | null;
  contactId: string | null;
  contact?: ProjectContact | null;
};

type ProjectContract = {
  id: string;
  projectId: string;
  contactId: string | null;
  title: string;
  contractType: string;
  status: ContractStatus;
  signedAt: string | null;
  validFrom: string | null;
  validTo: string | null;
  notes: string | null;
  contact?: ProjectContact | null;
};

type TimeEntry = {
  id: string;
  projectId: string;
  contactId: string | null;
  workDate: string;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
  hours: number | string;
  activity: string;
  approved: boolean;
  notes: string | null;
  contact?: ProjectContact | null;
};

type Expense = {
  id: string;
  amount: string | number;
  description: string | null;
  expenseDate: string | null;
  costCenterId: string | null;
  costCenter?: { name: string } | null;
};

type CostAccountingRow = {
  costCenterId: string;
  costCenterName: string;
  sollAmount: number;
  istAmount: number;
  forecastAmount: number;
  endkosten: number;
  variance: number;
};

type DashboardData = {
  projectId: string;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  nextShootDays: ShootDay[];
  topCostCenters: CostCenter[];
};

type DispositionActivity = {
  id: string;
  title: string;
  time: string | null;
  crew: string | null;
  notes: string | null;
  transport: string | null;
  equipment: string | null;
  catering: string | null;
};

type DispositionScene = {
  id: string;
  sceneNumber: string;
  title: string;
  synopsis: string | null;
  location: string | null;
  estimatedDuration: number | null;
};

type DispositionCrewMember = {
  id: string;
  name: string;
  role: string | null;
  callTime: string | null;
  wrapTime: string | null;
  notes: string | null;
};

type DispositionCastMember = {
  id: string;
  name: string;
  character: string | null;
  callTime: string | null;
  scenes: string | null;
  notes: string | null;
};

type ShootDisposition = {
  shootDayId: string;
  projectId: string;
  date: string;
  location: string | null;
  locationOwner: string | null;
  locationContactPerson: string | null;
  notes: string | null;
  callTime: string | null;
  weather: string | null;
  activities: DispositionActivity[];
  scenes: DispositionScene[];
  crewAssignments: DispositionCrewMember[];
  castAssignments: DispositionCastMember[];
};

type BudgetScenario = {
  id: string;
  costCenterId: string;
  name: string;
  amount: number | string;
  notes: string | null;
};

type CostPosition = {
  id: string;
  projectId: string;
  costCenterId: string | null;
  parentId: string | null;
  name: string;
  quantity: number | string;
  unitRate: number | string;
  notes: string | null;
  children?: CostPosition[];
};

type EditingCell = {
  id: string;
  draftValue: string;
} | null;

type ProjectInsight = {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  nextShootDays: number;
};

type RecentProjectEntry = {
  id: string;
  openedAt: string;
};

type ReferenceArea = {
  nameKey: string;
  status: "MVP" | "Phase 2" | "Referenzwissen";
  summaryKey: string;
};

const RECENT_PROJECTS_KEY = "omp-recent-projects";
const CURRENCY_KEY = "omp-currency";
const REFERENCE_AREAS: ReferenceArea[] = [
  { nameKey: "reference.kalkulation.name", status: "MVP", summaryKey: "reference.kalkulation.summary" },
  { nameKey: "reference.shootPlan.name", status: "MVP", summaryKey: "reference.shootPlan.summary" },
  { nameKey: "reference.externalCostAccounting.name", status: "MVP", summaryKey: "reference.externalCostAccounting.summary" },
  { nameKey: "reference.contactScheduling.name", status: "Phase 2", summaryKey: "reference.contactScheduling.summary" },
  { nameKey: "reference.contractManagement.name", status: "Phase 2", summaryKey: "reference.contractManagement.summary" },
  { nameKey: "reference.timeTracking.name", status: "Phase 2", summaryKey: "reference.timeTracking.summary" },
  { nameKey: "reference.financeAccounting.name", status: "Referenzwissen", summaryKey: "reference.financeAccounting.summary" },
  { nameKey: "reference.payrollAccounting.name", status: "Referenzwissen", summaryKey: "reference.payrollAccounting.summary" },
  { nameKey: "reference.assetAccounting.name", status: "Referenzwissen", summaryKey: "reference.assetAccounting.summary" },
  { nameKey: "reference.inventory.name", status: "Referenzwissen", summaryKey: "reference.inventory.summary" },
  { nameKey: "reference.invoiceInbox.name", status: "Referenzwissen", summaryKey: "reference.invoiceInbox.summary" },
  { nameKey: "reference.syncDisposition.name", status: "Referenzwissen", summaryKey: "reference.syncDisposition.summary" }
];

function readSelectedCurrency(): string {
  if (typeof window === "undefined") {
    return "EUR";
  }

  const raw = window.localStorage.getItem(CURRENCY_KEY);
  if (!raw) {
    return "EUR";
  }

  const supported = ["EUR", "USD", "GBP", "CHF"];
  return supported.includes(raw) ? raw : "EUR";
}

function readRecentProjects(): RecentProjectEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as RecentProjectEntry[]) : [];
  } catch {
    return [];
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) {
        message = body.message.join(", ");
      } else if (typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      // Ignore non-JSON bodies.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export default function App() {
  const { t, i18n } = useTranslation();
  
  const [view, setView] = useState<AppView>("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(DEMO_PROJECT_ID ?? null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [contacts, setContacts] = useState<ProjectContact[]>([]);
  const [appointments, setAppointments] = useState<ProjectAppointment[]>([]);
  const [contracts, setContracts] = useState<ProjectContract[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [dispositions, setDispositions] = useState<ShootDisposition[]>([]);
  const [costAccountingData, setCostAccountingData] = useState<CostAccountingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [freshlySavedId, setFreshlySavedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => readSelectedCurrency());

  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("pre");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [recentProjects, setRecentProjects] = useState<RecentProjectEntry[]>(() => readRecentProjects());
  const [projectInsights, setProjectInsights] = useState<Record<string, ProjectInsight>>({});
  const [costCenterName, setCostCenterName] = useState("");
  const [costCenterBudget, setCostCenterBudget] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseCostCenterId, setExpenseCostCenterId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [shootDayDate, setShootDayDate] = useState("");
  const [shootDayLocation, setShootDayLocation] = useState("");
  const [shootDayLocationOwner, setShootDayLocationOwner] = useState("");
  const [shootDayLocationContactPerson, setShootDayLocationContactPerson] = useState("");
  const [shootDayNotes, setShootDayNotes] = useState("");
  const [selectedDispositionId, setSelectedDispositionId] = useState<string>("");
  const [dispoTab, setDispoTab] = useState<"activities" | "scenes" | "crew" | "cast">("activities");

  // Contacts form
  const [contactName, setContactName] = useState("");
  const [contactCategory, setContactCategory] = useState<ContactCategory>("crew");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  // Appointments form
  const [appointmentTitle, setAppointmentTitle] = useState("");
  const [appointmentStartAt, setAppointmentStartAt] = useState("");
  const [appointmentEndAt, setAppointmentEndAt] = useState("");
  const [appointmentLocation, setAppointmentLocation] = useState("");
  const [appointmentContactId, setAppointmentContactId] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");

  // Contract form
  const [contractTitle, setContractTitle] = useState("");
  const [contractType, setContractType] = useState("Crew-Vertrag");
  const [contractStatus, setContractStatus] = useState<ContractStatus>("draft");
  const [contractContactId, setContractContactId] = useState("");
  const [contractValidFrom, setContractValidFrom] = useState("");
  const [contractValidTo, setContractValidTo] = useState("");
  const [contractNotes, setContractNotes] = useState("");

  // Time tracking form
  const [timeEntryDate, setTimeEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeEntryContactId, setTimeEntryContactId] = useState("");
  const [timeEntryActivity, setTimeEntryActivity] = useState("");
  const [timeEntryStart, setTimeEntryStart] = useState("");
  const [timeEntryEnd, setTimeEntryEnd] = useState("");
  const [timeEntryBreakMinutes, setTimeEntryBreakMinutes] = useState("0");
  const [timeEntryHours, setTimeEntryHours] = useState("");
  const [timeEntryApproved, setTimeEntryApproved] = useState(false);
  const [timeEntryNotes, setTimeEntryNotes] = useState("");

  // Scene form
  const [sceneNumber, setSceneNumber] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");
  const [sceneSynopsis, setSceneSynopsis] = useState("");
  const [sceneLocation, setSceneLocation] = useState("");
  const [sceneEstimatedDuration, setSceneEstimatedDuration] = useState("");

  // Crew form
  const [crewName, setCrewName] = useState("");
  const [crewRole, setCrewRole] = useState("");
  const [crewCallTime, setCrewCallTime] = useState("");
  const [crewWrapTime, setCrewWrapTime] = useState("");
  const [crewNotes, setCrewNotes] = useState("");

  // Cast form
  const [castName, setCastName] = useState("");
  const [castCharacter, setCastCharacter] = useState("");
  const [castCallTime, setCastCallTime] = useState("");
  const [castScenes, setCastScenes] = useState("");
  const [castNotes, setCastNotes] = useState("");

  // Activities form
  const [activityTitle, setActivityTitle] = useState("");
  const [activityTime, setActivityTime] = useState("");
  const [activityCrew, setActivityCrew] = useState("");
  const [activityNotes, setActivityNotes] = useState("");
  const [activityTransport, setActivityTransport] = useState("");
  const [activityEquipment, setActivityEquipment] = useState("");
  const [activityCatering, setActivityCatering] = useState("");

  // Activity inline editing
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActivityTime, setEditActivityTime] = useState("");
  const [editActivityTitle, setEditActivityTitle] = useState("");
  const [editActivityCrew, setEditActivityCrew] = useState("");
  const [editActivityNotes, setEditActivityNotes] = useState("");
  const [editActivityTransport, setEditActivityTransport] = useState("");
  const [editActivityEquipment, setEditActivityEquipment] = useState("");
  const [editActivityCatering, setEditActivityCatering] = useState("");

  // Disposition metadata form
  const [dispoCallTime, setDispoCallTime] = useState("");
  const [dispoWeather, setDispoWeather] = useState("");
  const [dispoGeneralNotes, setDispoGeneralNotes] = useState("");

  // Budget scenarios
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);
  const [selectedScenarioCostCenterId, setSelectedScenarioCostCenterId] = useState<string>("");
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioAmount, setScenarioAmount] = useState("");
  const [scenarioNotes, setScenarioNotes] = useState("");

  // Cost positions
  const [costPositions, setCostPositions] = useState<CostPosition[]>([]);
  const [expandedCostCenterIds, setExpandedCostCenterIds] = useState<Set<string>>(new Set());
  const [positionName, setPositionName] = useState("");
  const [positionCostCenterId, setPositionCostCenterId] = useState("");
  const [positionQuantity, setPositionQuantity] = useState("1");
  const [positionUnitRate, setPositionUnitRate] = useState("");
  const [positionNotes, setPositionNotes] = useState("");

  // Form validation errors
  const [appointmentError, setAppointmentError] = useState<string | null>(null);

  const activeLocale = useMemo(
    () => (i18n.resolvedLanguage ?? i18n.language).startsWith("en") ? "en-US" : "de-DE",
    [i18n.language, i18n.resolvedLanguage]
  );

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(activeLocale, {
      style: "currency",
      currency: selectedCurrency,
      maximumFractionDigits: 2
    }),
    [activeLocale, selectedCurrency]
  );

  function formatMoney(value: number): string {
    return currencyFormatter.format(value);
  }

  function formatProjectStatus(status: ProjectStatus | undefined): string {
    switch (status) {
      case "production":
        return t("projects.filming");
      case "post":
        return t("projects.postProduction");
      case "pre":
      default:
        return t("projects.preparation");
    }
  }

  function getProjectStatusBadgeClass(status: ProjectStatus | undefined): string {
    switch (status) {
      case "production":
        return "project-status-badge project-status-badge-production";
      case "post":
        return "project-status-badge project-status-badge-post";
      case "pre":
      default:
        return "project-status-badge project-status-badge-pre";
    }
  }

  function formatDateTime(value: string | undefined): string {
    if (!value) {
      return t("projects.notOpenedYet");
    }

    return new Date(value).toLocaleString(activeLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleDateString(activeLocale);
  }

  function formatContactCategory(value: ContactCategory): string {
    if (value === "crew") return t("contacts.categoryCrew");
    if (value === "cast") return t("contacts.categoryCast");
    return t("contacts.categoryOther");
  }

  const activeProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projects, projectId]
  );

  const selectedDisposition = useMemo(() => {
    if (selectedDispositionId) {
      return dispositions.find((item) => item.shootDayId === selectedDispositionId) ?? null;
    }
    return dispositions[0] ?? null;
  }, [dispositions, selectedDispositionId]);

  useEffect(() => {
    setDispoCallTime(selectedDisposition?.callTime ?? "");
    setDispoWeather(selectedDisposition?.weather ?? "");
    setDispoGeneralNotes(selectedDisposition?.notes ?? "");
  }, [selectedDisposition]);

  const recentProject = useMemo(() => {
    const recentMatch = recentProjects.find((entry) => projects.some((project) => project.id === entry.id));
    return recentMatch ? projects.find((project) => project.id === recentMatch.id) ?? null : null;
  }, [projects, recentProjects]);

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLocaleLowerCase();

    return projects.filter((project) => {
      const matchesStatus = projectStatusFilter === "all" || project.status === projectStatusFilter;
      const matchesQuery = !query
        || project.title.toLocaleLowerCase().includes(query)
        || (project.description ?? "").toLocaleLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [projectSearch, projectStatusFilter, projects]);

  async function loadProjects(preferredProjectId?: string): Promise<void> {
    const projectList = await parseJson<Project[]>(await fetch(`${API_BASE}/projects`));
    setProjects(projectList);

    if (projectList.length === 0) {
      setProjectId(null);
      return;
    }

    const candidateId = preferredProjectId ?? projectId ?? DEMO_PROJECT_ID ?? null;
    if (!candidateId) {
      setProjectId(null);
      return;
    }

    const selectedProject = projectList.find((project) => project.id === candidateId) ?? null;
    setProjectId(selectedProject?.id ?? null);
  }

  async function loadProjectData(currentProjectId: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const [
        dashboardResponse,
        costCentersResponse,
        expensesResponse,
        shootDaysResponse,
        contactsResponse,
        appointmentsResponse,
        contractsResponse,
        timeEntriesResponse,
        dispositionsResponse
      ] = await Promise.all([
        fetch(`${API_BASE}/projects/${currentProjectId}/dashboard`),
        fetch(`${API_BASE}/projects/${currentProjectId}/cost-centers`),
        fetch(`${API_BASE}/projects/${currentProjectId}/expenses`),
        fetch(`${API_BASE}/projects/${currentProjectId}/shoot-days`),
        fetch(`${API_BASE}/projects/${currentProjectId}/contacts`),
        fetch(`${API_BASE}/projects/${currentProjectId}/appointments`),
        fetch(`${API_BASE}/projects/${currentProjectId}/contracts`),
        fetch(`${API_BASE}/projects/${currentProjectId}/time-entries`),
        fetch(`${API_BASE}/projects/${currentProjectId}/shoot-dispositions`)
      ]);

      const [dashboardData, rawCostCenters, expenseData, shootDayData, contactsData, appointmentsData, contractsData, timeEntriesData, dispositionData] = await Promise.all([
        parseJson<DashboardData>(dashboardResponse),
        parseJson<Array<{ id: string; name: string; budget: string | number }>>(costCentersResponse),
        parseJson<Expense[]>(expensesResponse),
        parseJson<ShootDay[]>(shootDaysResponse),
        parseJson<ProjectContact[]>(contactsResponse),
        parseJson<ProjectAppointment[]>(appointmentsResponse),
        parseJson<ProjectContract[]>(contractsResponse),
        parseJson<TimeEntry[]>(timeEntriesResponse),
        parseJson<ShootDisposition[]>(dispositionsResponse)
      ]);

      let costAccountingDataRaw: CostAccountingRow[] = [];
      try {
        const costAccountingResponse = await fetch(`${API_BASE}/external-cost-accounting?projectId=${currentProjectId}`);
        costAccountingDataRaw = await parseJson<CostAccountingRow[]>(costAccountingResponse);
      } catch (costAccountingError) {
        console.warn("External cost accounting unavailable:", costAccountingError);
      }

      const spentById = new Map<string, number>(
        dashboardData.topCostCenters.map((costCenter) => [costCenter.id, costCenter.spent])
      );

      setDashboard(dashboardData);
      setCostCenters(
        rawCostCenters.map((costCenter) => ({
          id: costCenter.id,
          name: costCenter.name,
          budget: Number(costCenter.budget),
          spent: spentById.get(costCenter.id) ?? 0
        }))
      );
      setExpenses(expenseData);
      setShootDays(shootDayData);
      setContacts(contactsData);
      setAppointments(appointmentsData);
      setContracts(contractsData);
      setTimeEntries(timeEntriesData);
      setDispositions(dispositionData);
      setSelectedDispositionId((previous) => {
        if (previous && dispositionData.some((item) => item.shootDayId === previous)) {
          return previous;
        }
        return dispositionData[0]?.shootDayId ?? "";
      });
      setCostAccountingData(costAccountingDataRaw);

      let costPositionsData: CostPosition[] = [];
      try {
        const costPositionsResponse = await fetch(`${API_BASE}/cost-positions?projectId=${currentProjectId}`);
        costPositionsData = await parseJson<CostPosition[]>(costPositionsResponse);
      } catch {
        // cost positions optional
      }
      setCostPositions(costPositionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    } finally {
      setLoading(false);
    }
  }

  async function refreshCurrentProject(): Promise<void> {
    if (!projectId) return;
    await loadProjects(projectId);
    await loadProjectData(projectId);
  }

  function hasUnsavedDrafts(): boolean {
    const defaultTimeEntryDate = new Date().toISOString().slice(0, 10);

    return (
      projectTitle.trim().length > 0
      || projectDescription.trim().length > 0
      || costCenterName.trim().length > 0
      || costCenterBudget.trim().length > 0
      || expenseAmount.trim().length > 0
      || expenseDescription.trim().length > 0
      || expenseCostCenterId.length > 0
      || (expenseDate.length > 0 && expenseDate !== new Date().toISOString().slice(0, 10))
      || shootDayDate.length > 0
      || shootDayLocation.trim().length > 0
      || shootDayLocationOwner.trim().length > 0
      || shootDayLocationContactPerson.trim().length > 0
      || shootDayNotes.trim().length > 0
      || contactName.trim().length > 0
      || contactCategory !== "crew"
      || contactEmail.trim().length > 0
      || contactPhone.trim().length > 0
      || contactNotes.trim().length > 0
      || appointmentTitle.trim().length > 0
      || appointmentStartAt.length > 0
      || appointmentEndAt.length > 0
      || appointmentLocation.trim().length > 0
      || appointmentContactId.length > 0
      || appointmentNotes.trim().length > 0
      || contractTitle.trim().length > 0
      || contractType !== "Crew-Vertrag"
      || contractStatus !== "draft"
      || contractContactId.length > 0
      || contractValidFrom.length > 0
      || contractValidTo.length > 0
      || contractNotes.trim().length > 0
      || timeEntryDate !== defaultTimeEntryDate
      || timeEntryContactId.length > 0
      || timeEntryActivity.trim().length > 0
      || timeEntryStart.length > 0
      || timeEntryEnd.length > 0
      || timeEntryBreakMinutes !== "0"
      || timeEntryHours.trim().length > 0
      || timeEntryApproved
      || timeEntryNotes.trim().length > 0
      || sceneNumber.trim().length > 0
      || sceneTitle.trim().length > 0
      || sceneSynopsis.trim().length > 0
      || sceneLocation.trim().length > 0
      || sceneEstimatedDuration.trim().length > 0
      || crewName.trim().length > 0
      || crewRole.trim().length > 0
      || crewCallTime.trim().length > 0
      || crewWrapTime.trim().length > 0
      || crewNotes.trim().length > 0
      || castName.trim().length > 0
      || castCharacter.trim().length > 0
      || castCallTime.trim().length > 0
      || castScenes.trim().length > 0
      || castNotes.trim().length > 0
      || activityTitle.trim().length > 0
      || activityTime.trim().length > 0
      || activityCrew.trim().length > 0
      || activityNotes.trim().length > 0
      || activityTransport.trim().length > 0
      || activityEquipment.trim().length > 0
      || activityCatering.trim().length > 0
      || editingActivityId !== null
      || editActivityTime.trim().length > 0
      || editActivityTitle.trim().length > 0
      || editActivityCrew.trim().length > 0
      || editActivityNotes.trim().length > 0
      || editActivityTransport.trim().length > 0
      || editActivityEquipment.trim().length > 0
      || editActivityCatering.trim().length > 0
      || dispoCallTime.trim().length > 0
      || dispoWeather.trim().length > 0
      || dispoGeneralNotes.trim().length > 0
      || selectedScenarioCostCenterId.length > 0
      || scenarioName.trim().length > 0
      || scenarioAmount.trim().length > 0
      || scenarioNotes.trim().length > 0
      || positionName.trim().length > 0
      || positionCostCenterId.length > 0
      || positionQuantity !== "1"
      || positionUnitRate.trim().length > 0
      || positionNotes.trim().length > 0
      || editingCell !== null
      || appointmentError !== null
    );
  }

  function handleCloseProject(): void {
    if (hasUnsavedDrafts() && !window.confirm(t("messages.confirmCloseWithUnsaved"))) {
      return;
    }

    setProjectId(null);
    setView("dashboard");
    setError(null);
    setSelectedDispositionId("");
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    void loadProjectData(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") {
      return;
    }

    const storedRecentProjects = readRecentProjects();
    const updatedRecentProjects = [
      { id: projectId, openedAt: new Date().toISOString() },
      ...storedRecentProjects.filter((entry) => entry.id !== projectId)
    ].slice(0, 6);

    setRecentProjects(updatedRecentProjects);
    window.localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updatedRecentProjects));
  }, [projectId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CURRENCY_KEY, selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    if (projects.length === 0) {
      setProjectInsights({});
      return;
    }

    let cancelled = false;

    async function loadProjectInsights(): Promise<void> {
      const results = await Promise.all(
        projects.map(async (project) => {
          try {
            const dashboardData = await parseJson<DashboardData>(await fetch(`${API_BASE}/projects/${project.id}/dashboard`));
            return [project.id, {
              totalBudget: dashboardData.totalBudget,
              totalSpent: dashboardData.totalSpent,
              remainingBudget: dashboardData.remainingBudget,
              nextShootDays: dashboardData.nextShootDays.length
            }] as const;
          } catch {
            return [project.id, {
              totalBudget: 0,
              totalSpent: 0,
              remainingBudget: 0,
              nextShootDays: 0
            }] as const;
          }
        })
      );

      if (!cancelled) {
        setProjectInsights(Object.fromEntries(results));
      }
    }

    void loadProjectInsights();

    return () => {
      cancelled = true;
    };
  }, [projects]);

  const totalBudget = dashboard?.totalBudget ?? costCenters.reduce((sum, center) => sum + center.budget, 0);
  const totalSpent = dashboard?.totalSpent ?? costCenters.reduce((sum, center) => sum + center.spent, 0);
  const remainingBudget = dashboard?.remainingBudget ?? (totalBudget - totalSpent);
  const nextShootDays = dashboard?.nextShootDays ?? [];
  const topCostCenters = dashboard?.topCostCenters ?? [...costCenters].sort((a, b) => b.spent - a.spent).slice(0, 3);
  const appointmentCalendar = useMemo(() => {
    const grouped = new Map<string, ProjectAppointment[]>();
    appointments.forEach((appointment) => {
      const key = new Date(appointment.startAt).toISOString().slice(0, 10);
      const list = grouped.get(key) ?? [];
      list.push(appointment);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => a.startAt.localeCompare(b.startAt))
      }));
  }, [appointments]);
  const activeStatusLabel = formatProjectStatus(activeProject?.status);
  const currentViewLabel = !projectId
    ? t("views.projectSelection")
    : view === "dashboard"
      ? t("views.projectOverview")
      : view === "budget"
        ? t("navigation.budget")
        : view === "expenses"
          ? t("navigation.expenses")
          : view === "shootDays"
            ? t("navigation.shootPlan")
              : view === "contacts"
                ? t("navigation.contacts")
                  : view === "contracts"
                    ? t("navigation.contracts")
                    : view === "timeTracking"
                      ? t("navigation.timeTracking")
                      : t("navigation.disposition");

    useEffect(() => {
      const titleBase = t("app.title");
      const context = projectId
        ? `${activeProject?.title ?? ""} - ${currentViewLabel}`.trim()
        : t("views.projectSelection");
      document.title = `${titleBase} v${APP_VERSION} | ${context}`;
    }, [activeProject?.title, currentViewLabel, projectId, t]);

  function startBudgetEdit(costCenter: CostCenter): void {
    setEditingCell({ id: costCenter.id, draftValue: String(costCenter.budget) });
  }

  function cancelBudgetEdit(): void {
    setEditingCell(null);
  }

  async function saveBudgetEdit(centerId: string): Promise<void> {
    if (!editingCell || editingCell.id !== centerId || !projectId) {
      return;
    }

    const parsed = Number(editingCell.draftValue.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError(t("budget.invalidBudget"));
      return;
    }

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/cost-centers/${centerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ budget: Number(parsed.toFixed(2)) })
        })
      );
      setEditingCell(null);
      setFreshlySavedId(centerId);
      window.setTimeout(() => setFreshlySavedId(null), 320);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("budget.saveBudgetFailed"));
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    try {
      const project = await parseJson<Project>(
        await fetch(`${API_BASE}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: projectTitle,
            description: projectDescription || undefined,
            status: projectStatus
          })
        })
      );

      setProjectTitle("");
      setProjectDescription("");
      setProjectStatus("pre");
      await loadProjects(project.id);
      setView("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("projects.createFailed"));
    }
  }

  async function handleCreateCostCenter(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId) return;

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/cost-centers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: costCenterName,
            budget: Number(costCenterBudget.replace(",", "."))
          })
        })
      );
      setCostCenterName("");
      setCostCenterBudget("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("costCenters.createFailed"));
    }
  }

  async function handleCreateExpense(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId) return;

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(expenseAmount.replace(",", ".")),
            description: expenseDescription || undefined,
            costCenterId: expenseCostCenterId || undefined,
            expenseDate: expenseDate || undefined
          })
        })
      );
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseCostCenterId("");
      setExpenseDate(new Date().toISOString().slice(0, 10));
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("expenses.createFailed"));
    }
  }

  async function handleCreateShootDay(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId) return;

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/shoot-days`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: shootDayDate,
            location: shootDayLocation || undefined,
            locationOwner: shootDayLocationOwner || undefined,
            locationContactPerson: shootDayLocationContactPerson || undefined,
            notes: shootDayNotes || undefined
          })
        })
      );
      setShootDayDate("");
      setShootDayLocation("");
      setShootDayLocationOwner("");
      setShootDayLocationContactPerson("");
      setShootDayNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("shootDays.createFailed"));
    }
  }

  async function handleCreateContact(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId || !contactName.trim()) return;

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: contactName.trim(),
            category: contactCategory,
            email: contactEmail.trim() || undefined,
            phone: contactPhone.trim() || undefined,
            notes: contactNotes.trim() || undefined
          })
        })
      );
      setContactName("");
      setContactCategory("crew");
      setContactEmail("");
      setContactPhone("");
      setContactNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleDeleteContact(contactId: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/contacts/${contactId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId || !appointmentTitle.trim() || !appointmentStartAt) return;

    if (appointmentEndAt && new Date(appointmentEndAt) <= new Date(appointmentStartAt)) {
      setAppointmentError(t("contacts.endBeforeStart"));
      return;
    }
    setAppointmentError(null);

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: appointmentTitle.trim(),
            startAt: new Date(appointmentStartAt).toISOString(),
            endAt: appointmentEndAt ? new Date(appointmentEndAt).toISOString() : undefined,
            location: appointmentLocation.trim() || undefined,
            contactId: appointmentContactId || undefined,
            notes: appointmentNotes.trim() || undefined
          })
        })
      );
      setAppointmentTitle("");
      setAppointmentStartAt("");
      setAppointmentEndAt("");
      setAppointmentLocation("");
      setAppointmentContactId("");
      setAppointmentNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleDeleteAppointment(appointmentId: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/appointments/${appointmentId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleCreateContract(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId || !contractTitle.trim() || !contractType.trim()) return;

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/contracts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: contractTitle.trim(),
            contractType: contractType.trim(),
            status: contractStatus,
            contactId: contractContactId || undefined,
            validFrom: contractValidFrom || undefined,
            validTo: contractValidTo || undefined,
            notes: contractNotes.trim() || undefined
          })
        })
      );

      setContractTitle("");
      setContractType("Crew-Vertrag");
      setContractStatus("draft");
      setContractContactId("");
      setContractValidFrom("");
      setContractValidTo("");
      setContractNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleDeleteContract(contractId: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/contracts/${contractId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleCreateTimeEntry(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId || !timeEntryDate || !timeEntryActivity.trim()) return;

    try {
      await parseJson(
        await fetch(`${API_BASE}/projects/${projectId}/time-entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workDate: timeEntryDate,
            contactId: timeEntryContactId || undefined,
            activity: timeEntryActivity.trim(),
            startTime: timeEntryStart || undefined,
            endTime: timeEntryEnd || undefined,
            breakMinutes: Number(timeEntryBreakMinutes || "0"),
            hours: timeEntryHours ? Number(timeEntryHours.replace(",", ".")) : undefined,
            approved: timeEntryApproved,
            notes: timeEntryNotes.trim() || undefined
          })
        })
      );

      setTimeEntryDate(new Date().toISOString().slice(0, 10));
      setTimeEntryContactId("");
      setTimeEntryActivity("");
      setTimeEntryStart("");
      setTimeEntryEnd("");
      setTimeEntryBreakMinutes("0");
      setTimeEntryHours("");
      setTimeEntryApproved(false);
      setTimeEntryNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleDeleteTimeEntry(timeEntryId: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;

    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/time-entries/${timeEntryId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleDeleteProject(id: string, title: string): Promise<void> {
    if (!window.confirm(`${t("messages.confirmDelete")}\n\n"${title}"\n\n${t("messages.confirmAction")}`)) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      if (projectId === id) setProjectId(null);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.delete"));
    }
  }

  async function handleDeleteCostCenter(id: string, name: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(`${t("messages.confirmDelete")}\n\n"${name}"\n\n${t("messages.confirmAction")}`)) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/cost-centers/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.delete"));
    }
  }

  async function handleDeleteExpense(id: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(`${t("messages.confirmDelete")}\n\n${t("messages.confirmAction")}`)) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/expenses/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.delete"));
    }
  }

  async function handleDeleteShootDay(id: string, date: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(`${t("messages.confirmDelete")}\n\n${date}\n\n${t("messages.confirmAction")}`)) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) throw new Error(`${response.status} ${response.statusText}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.delete"));
    }
  }

  async function loadScenarios(costCenterId: string): Promise<void> {
    try {
      const data = await parseJson<BudgetScenario[]>(await fetch(`${API_BASE}/budget-scenarios?costCenterId=${costCenterId}`));
      setScenarios(data);
    } catch {
      setScenarios([]);
    }
  }

  async function handleCreateScenario(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedScenarioCostCenterId || !scenarioName.trim() || !scenarioAmount) return;
    const amount = Number(scenarioAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) { setError(t("budget.invalidBudget")); return; }
    try {
      await parseJson(await fetch(`${API_BASE}/budget-scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costCenterId: selectedScenarioCostCenterId, name: scenarioName.trim(), amount, notes: scenarioNotes.trim() || undefined })
      }));
      setScenarioName("");
      setScenarioAmount("");
      setScenarioNotes("");
      await loadScenarios(selectedScenarioCostCenterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleDeleteScenario(id: string): Promise<void> {
    if (!window.confirm(t("messages.confirmDelete"))) return;
    try {
      await fetch(`${API_BASE}/budget-scenarios/${id}`, { method: "DELETE" });
      if (selectedScenarioCostCenterId) await loadScenarios(selectedScenarioCostCenterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleCreateCostPosition(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!projectId || !positionName.trim() || !positionCostCenterId) return;
    const qty = Number(positionQuantity.replace(",", ".")) || 1;
    const rate = Number(positionUnitRate.replace(",", ".")) || 0;
    try {
      await parseJson(await fetch(`${API_BASE}/cost-positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, costCenterId: positionCostCenterId, name: positionName.trim(), quantity: qty, unitRate: rate, notes: positionNotes.trim() || undefined })
      }));
      setPositionName("");
      setPositionQuantity("1");
      setPositionUnitRate("");
      setPositionNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  async function handleDeleteCostPosition(id: string): Promise<void> {
    if (!projectId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;
    try {
      await fetch(`${API_BASE}/cost-positions/${id}`, { method: "DELETE" });
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.error"));
    }
  }

  function toggleCostCenterExpanded(costCenterId: string): void {
    setExpandedCostCenterIds((previous) => {
      const next = new Set(previous);
      if (next.has(costCenterId)) {
        next.delete(costCenterId);
      } else {
        next.add(costCenterId);
      }
      return next;
    });
  }

  async function handleExportDisposition(disposition: ShootDisposition): Promise<void> {
    if (!activeProject) {
      return;
    }

    const html = generateDrehdispoHTML(activeProject.title, disposition, {
      locale: activeLocale,
      labels: {
        reportTitle: t("disposition.reportTitle"),
        date: t("columns.date"),
        location: t("columns.location"),
        callTime: t("disposition.callTime"),
        weather: t("disposition.weather"),
        generalNotes: t("disposition.generalNotes"),
        sceneTableTitle: t("disposition.sceneTableTitle"),
        time: t("disposition.time"),
        scene: t("disposition.scene"),
        crew: t("disposition.crew"),
        notes: t("columns.notes"),
        scenes: t("disposition.tabScenes"),
        transport: t("disposition.transport"),
        equipment: t("disposition.equipment"),
        catering: t("disposition.catering"),
        crewTitle: t("disposition.tabCrew"),
        castTitle: t("disposition.tabCast"),
        sceneTitle: t("disposition.sceneTitle"),
        synopsis: t("disposition.synopsis"),
        duration: t("disposition.duration"),
        role: t("disposition.crewRole"),
        wrapTime: t("disposition.wrapTime"),
        character: t("disposition.character")
      }
    });

    const tempId = "temp-drehdispo";
    const element = document.createElement("div");
    element.innerHTML = html;
    element.id = tempId;
    document.body.appendChild(element);

    try {
      const filename = `${activeProject.title.replace(/[^a-z0-9äöü\s-]/gi, "").replace(/\s+/g, "-").toLowerCase()}_drehdispo_${new Date(disposition.date).toISOString().slice(0, 10)}`;
      await exportToPDF(tempId, {
        filename,
        title: `${activeProject.title} - ${t("disposition.reportTitle")}`
      });
    } finally {
      document.body.removeChild(element);
    }
  }

  function handlePrintDisposition(disposition: ShootDisposition): void {
    if (!activeProject) {
      return;
    }

    const html = generateDrehdispoHTML(activeProject.title, disposition, {
      locale: activeLocale,
      labels: {
        reportTitle: t("disposition.reportTitle"),
        date: t("columns.date"),
        location: t("columns.location"),
        callTime: t("disposition.callTime"),
        weather: t("disposition.weather"),
        generalNotes: t("disposition.generalNotes"),
        sceneTableTitle: t("disposition.sceneTableTitle"),
        time: t("disposition.time"),
        scene: t("disposition.scene"),
        crew: t("disposition.crew"),
        notes: t("columns.notes"),
        scenes: t("disposition.tabScenes"),
        transport: t("disposition.transport"),
        equipment: t("disposition.equipment"),
        catering: t("disposition.catering"),
        crewTitle: t("disposition.tabCrew"),
        castTitle: t("disposition.tabCast"),
        sceneTitle: t("disposition.sceneTitle"),
        synopsis: t("disposition.synopsis"),
        duration: t("disposition.duration"),
        role: t("disposition.crewRole"),
        wrapTime: t("disposition.wrapTime"),
        character: t("disposition.character")
      }
    });
    openPrintPreview(html);
  }

  async function handleAddScene(): Promise<void> {
    if (!projectId || !selectedDispositionId || !sceneNumber.trim() || !sceneTitle.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneNumber: sceneNumber.trim(),
          title: sceneTitle.trim(),
          synopsis: sceneSynopsis.trim() || undefined,
          location: sceneLocation.trim() || undefined,
          estimatedDuration: sceneEstimatedDuration ? Number(sceneEstimatedDuration) : undefined
        })
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setSceneNumber(""); setSceneTitle(""); setSceneSynopsis(""); setSceneLocation(""); setSceneEstimatedDuration("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDeleteScene(sceneId: string): Promise<void> {
    if (!projectId || !selectedDispositionId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/scenes/${sceneId}`, { method: "DELETE" });
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleAddCrewMember(): Promise<void> {
    if (!projectId || !selectedDispositionId || !crewName.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/crew-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: crewName.trim(),
          role: crewRole.trim() || undefined,
          callTime: crewCallTime.trim() || undefined,
          wrapTime: crewWrapTime.trim() || undefined,
          notes: crewNotes.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setCrewName(""); setCrewRole(""); setCrewCallTime(""); setCrewWrapTime(""); setCrewNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDeleteCrewMember(crewId: string): Promise<void> {
    if (!projectId || !selectedDispositionId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/crew-assignments/${crewId}`, { method: "DELETE" });
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleAddCastMember(): Promise<void> {
    if (!projectId || !selectedDispositionId || !castName.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/cast-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: castName.trim(),
          character: castCharacter.trim() || undefined,
          callTime: castCallTime.trim() || undefined,
          scenes: castScenes.trim() || undefined,
          notes: castNotes.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setCastName(""); setCastCharacter(""); setCastCallTime(""); setCastScenes(""); setCastNotes("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDeleteCastMember(castId: string): Promise<void> {
    if (!projectId || !selectedDispositionId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;
    try {
      await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/cast-assignments/${castId}`, { method: "DELETE" });
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleAddActivity(): Promise<void> {
    if (!projectId || !selectedDispositionId || !activityTitle.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activityTitle.trim(),
          time: activityTime.trim() || undefined,
          crew: activityCrew.trim() || undefined,
          notes: activityNotes.trim() || undefined,
          transport: activityTransport.trim() || undefined,
          equipment: activityEquipment.trim() || undefined,
          catering: activityCatering.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setActivityTitle(""); setActivityTime(""); setActivityCrew(""); setActivityNotes("");
      setActivityTransport(""); setActivityEquipment(""); setActivityCatering("");
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  function handleStartEditActivity(activity: DispositionActivity): void {
    setEditingActivityId(activity.id);
    setEditActivityTime(activity.time ?? "");
    setEditActivityTitle(activity.title);
    setEditActivityCrew(activity.crew ?? "");
    setEditActivityNotes(activity.notes ?? "");
    setEditActivityTransport(activity.transport ?? "");
    setEditActivityEquipment(activity.equipment ?? "");
    setEditActivityCatering(activity.catering ?? "");
  }

  function handleCancelEditActivity(): void {
    setEditingActivityId(null);
    setEditActivityTime("");
    setEditActivityTitle("");
    setEditActivityCrew("");
    setEditActivityNotes("");
    setEditActivityTransport("");
    setEditActivityEquipment("");
    setEditActivityCatering("");
  }

  async function handleSaveEditActivity(): Promise<void> {
    if (!projectId || !selectedDispositionId || !editingActivityId || !editActivityTitle.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/activities/${editingActivityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editActivityTitle.trim(),
          time: editActivityTime.trim() || undefined,
          crew: editActivityCrew.trim() || undefined,
          notes: editActivityNotes.trim() || undefined,
          transport: editActivityTransport.trim() || undefined,
          equipment: editActivityEquipment.trim() || undefined,
          catering: editActivityCatering.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setEditingActivityId(null);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDeleteActivity(activityId: string): Promise<void> {
    if (!projectId || !selectedDispositionId) return;
    if (!window.confirm(t("messages.confirmDelete"))) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}/activities/${activityId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error(`${response.status}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleSaveDispositionMeta(): Promise<void> {
    if (!projectId || !selectedDispositionId || !selectedDisposition) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/shoot-days/${selectedDispositionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDisposition.date,
          location: selectedDisposition.location ?? undefined,
          notes: dispoGeneralNotes.trim() || undefined,
          callTime: dispoCallTime.trim() || undefined,
          weather: dispoWeather.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`${response.status}`);
      await loadProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="app-shell">
      <div className="workspace-window">
        <header className="window-titlebar">
          <div className="titlebar-left">
            <span className="titlebar-dot" />
            <span className="titlebar-text">{t("app.title")}</span>
            <span className="titlebar-version">v{APP_VERSION}</span>
            <span className="titlebar-context">{currentViewLabel}</span>
          </div>
          <div className="titlebar-actions">
            <span className="window-chrome" />
            <span className="window-chrome" />
            <span className="window-chrome close" />
          </div>
        </header>

        <div className="toolbar-strip">
          <button className="toolbar-button toolbar-button-strong" onClick={() => void refreshCurrentProject()} disabled={!projectId || loading}>{t("messages.reloadPage")}</button>
          <button className="toolbar-button" onClick={handleCloseProject} disabled={!projectId}>{t("projects.closeProject")}</button>
          <div className="toolbar-spacer" />
          <span className="toolbar-meta">{projects.length} {t("projects.title")}</span>
          <span className="toolbar-meta">{costCenters.length} {t("costCenters.title")}</span>
          <span className="toolbar-meta">{expenses.length} {t("expenses.bookings")}</span>
          <button className="settings-button" onClick={() => setShowSettings(true)} title={t('settings.title')}>
            ⚙️ {t('settings.title')}
          </button>
        </div>

        <div className="workspace-body">
          <aside className="module-sidebar">
            <div className="module-sidebar-header">
              <p className="sidebar-overline">{t("sidebar.modules")}</p>
              <h1 className="sidebar-title">{t("sidebar.productionSuite")}</h1>
            </div>
            <nav className="module-nav">
              <button className={`module-nav-item ${view === "dashboard" ? "module-nav-item-active" : ""}`} onClick={() => setView("dashboard")}>
                <span className="module-code">01</span>
                <span>
                  <strong>{t("sidebar.projectWindow")}</strong>
                  <small>{t("sidebar.projectWindowHint")}</small>
                </span>
              </button>
              <button className={`module-nav-item ${view === "budget" ? "module-nav-item-active" : ""}`} onClick={() => setView("budget")}>
                <span className="module-code">02</span>
                <span>
                  <strong>{t("navigation.budget")}</strong>
                  <small>{t("sidebar.budgetHint")}</small>
                </span>
              </button>
              <button className={`module-nav-item ${view === "expenses" ? "module-nav-item-active" : ""}`} onClick={() => setView("expenses")}>
                <span className="module-code">03</span>
                <span>
                  <strong>{t("navigation.expenses")}</strong>
                  <small>{t("sidebar.expensesHint")}</small>
                </span>
              </button>
              <button className={`module-nav-item ${view === "shootDays" ? "module-nav-item-active" : ""}`} onClick={() => setView("shootDays")}>
                <span className="module-code">04</span>
                <span>
                  <strong>{t("navigation.shootPlan")}</strong>
                  <small>{t("sidebar.shootPlanHint")}</small>
                </span>
              </button>
              <button className={`module-nav-item ${view === "contacts" ? "module-nav-item-active" : ""}`} onClick={() => setView("contacts")}>
                <span className="module-code">05</span>
                <span>
                  <strong>{t("navigation.contacts")}</strong>
                  <small>{t("sidebar.contactsHint")}</small>
                </span>
              </button>
              <button className={`module-nav-item ${view === "contracts" ? "module-nav-item-active" : ""}`} onClick={() => setView("contracts")}>
                <span className="module-code">06</span>
                <span>
                  <strong>{t("navigation.contracts")}</strong>
                  <small>{t("sidebar.contractsHint")}</small>
                </span>
              </button>
              <button className={`module-nav-item ${view === "timeTracking" ? "module-nav-item-active" : ""}`} onClick={() => setView("timeTracking")}>
                <span className="module-code">07</span>
                <span>
                  <strong>{t("navigation.timeTracking")}</strong>
                  <small>{t("sidebar.timeTrackingHint")}</small>
                </span>
              </button>
              <button className={`module-nav-item ${view === "disposition" ? "module-nav-item-active" : ""}`} onClick={() => setView("disposition")}>
                <span className="module-code">08</span>
                <span>
                  <strong>{t("navigation.disposition")}</strong>
                  <small>{t("sidebar.dispositionHint")}</small>
                </span>
              </button>
            </nav>
            <div className="reference-note">
              <p className="sidebar-overline">{t("sidebar.layoutPrinciple")}</p>
              <p>{t("sidebar.layoutDescription")}</p>
            </div>
          </aside>

          <main className="workspace-main">
            {error ? <div className="message-bar message-bar-error">{t("messages.apiError")}: {error}</div> : null}

            <section className="workspace-header panel">
              <div className="workspace-header-top">
                <div>
                  <p className="section-tag">{t("projects.activeProject")}</p>
                  <div className="project-heading-row">
                    <h2 className="workspace-title">{activeProject?.title ?? t("projects.chooseProject")}</h2>
                    <span className="status-chip">{activeStatusLabel}</span>
                  </div>
                  <p className="workspace-subtitle">{activeProject?.description ?? t("projects.selectOrCreate")}</p>
                </div>
                <div className="workspace-header-actions">
                  <label className="field-block compact-field">
                    <span className="field-label">{t("views.projectList")}</span>
                    <select className="input-field" value={projectId ?? ""} onChange={(event) => setProjectId(event.target.value || null)}>
                      <option value="">{t("projects.selectProject")}</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.title}</option>
                      ))}
                    </select>
                  </label>
                  <button className="action-ghost" onClick={() => void refreshCurrentProject()} disabled={!projectId || loading}>{t("common.refresh")}</button>
                  {activeProject ? (
                    <button className="action-ghost" onClick={handleCloseProject}>{t("projects.closeProject")}</button>
                  ) : null}
                  {activeProject ? (
                    <button className="action-danger" onClick={() => void handleDeleteProject(activeProject.id, activeProject.title)}>{t("projects.deleteProject")}</button>
                  ) : null}
                </div>
              </div>

              {projectId ? (
                <form className="workspace-form-grid" onSubmit={(event) => void handleCreateProject(event)}>
                  <label className="field-block">
                    <span className="field-label">{t("projects.projectTitle")}</span>
                    <input required className="input-field" placeholder={t("projects.newProject")} value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
                  </label>
                  <label className="field-block">
                    <span className="field-label">{t("projects.projectDescription")}</span>
                    <input className="input-field" placeholder={t("projects.projectDescription")} value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} />
                  </label>
                  <label className="field-block compact-field">
                    <span className="field-label">{t("projects.phase")}</span>
                    <select className="input-field" value={projectStatus} onChange={(event) => setProjectStatus(event.target.value as ProjectStatus)}>
                      <option value="pre">{t("projects.preparation")}</option>
                      <option value="production">{t("projects.filming")}</option>
                      <option value="post">{t("projects.postProduction")}</option>
                    </select>
                  </label>
                  <button className="action-primary align-end" type="submit">{t("projects.createProject")}</button>
                </form>
              ) : (
                <div className="project-launchpad">
                  {recentProject ? (
                    <article className="panel chooser-panel chooser-hero">
                      <div className="panel-titlebar compact">
                        <div>
                          <p className="section-tag">{t("projects.recent")}</p>
                          <h3>{t("projects.resumeProject")}</h3>
                        </div>
                      </div>
                      <div className="chooser-hero-body">
                        <div>
                          <strong className="chooser-hero-title">{recentProject.title}</strong>
                          <p className="chooser-hero-copy">{recentProject.description ?? t("projects.lastProjectFallback")}</p>
                          <div className="chooser-inline-meta">
                            <span className={getProjectStatusBadgeClass(recentProject.status)}>{formatProjectStatus(recentProject.status)}</span>
                            <span>{formatDateTime(recentProjects.find((entry) => entry.id === recentProject.id)?.openedAt)}</span>
                            <span>{formatMoney(projectInsights[recentProject.id]?.totalBudget ?? 0)} {t("columns.budget")}</span>
                          </div>
                        </div>
                        <button className="action-primary" onClick={() => setProjectId(recentProject.id)}>{t("projects.openLastProject")}</button>
                      </div>
                    </article>
                  ) : null}

                  <div className="project-chooser-grid">
                    <article className="panel chooser-panel">
                      <div className="panel-titlebar compact">
                        <div>
                          <p className="section-tag">{t("projects.existing")}</p>
                          <h3>{t("projects.openExistingProject")}</h3>
                        </div>
                      </div>
                      <div className="chooser-toolbar">
                        <label className="field-block">
                          <span className="field-label">{t("common.search")}</span>
                          <input className="input-field" placeholder={t("projects.filterPlaceholder")} value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} />
                        </label>
                        <label className="field-block compact-field">
                          <span className="field-label">{t("projects.status")}</span>
                          <select className="input-field" value={projectStatusFilter} onChange={(event) => setProjectStatusFilter(event.target.value as "all" | ProjectStatus)}>
                            <option value="all">{t("projects.allPhases")}</option>
                            <option value="pre">{t("projects.preparation")}</option>
                            <option value="production">{t("projects.filming")}</option>
                            <option value="post">{t("projects.postProduction")}</option>
                          </select>
                        </label>
                      </div>
                      <div className="chooser-list chooser-card-list">
                        {filteredProjects.length === 0 ? (
                          <div className="chooser-empty">{t("projects.noFilteredProjects")}</div>
                        ) : (
                          filteredProjects.map((project) => {
                            const insight = projectInsights[project.id];
                            const recentEntry = recentProjects.find((entry) => entry.id === project.id);
                            return (
                              <button key={project.id} className="chooser-card" onClick={() => setProjectId(project.id)}>
                                <div className="chooser-card-header">
                                  <div className="chooser-item-main">
                                    <strong>{project.title}</strong>
                                    <small>{project.description ?? t("projects.noDescription")}</small>
                                  </div>
                                  <span className={getProjectStatusBadgeClass(project.status)}>{formatProjectStatus(project.status)}</span>
                                </div>
                                <div className="chooser-card-metrics">
                                  <span><strong>{formatMoney(insight?.totalBudget ?? 0)}</strong><small>{t("columns.budget")}</small></span>
                                  <span><strong>{formatMoney(insight?.remainingBudget ?? 0)}</strong><small>{t("dashboard.balance")}</small></span>
                                  <span><strong>{insight?.nextShootDays ?? 0}</strong><small>{t("dashboard.shootDays")}</small></span>
                                </div>
                                <div className="chooser-card-footer">
                                  <span>{t("projects.lastOpened")}: {formatDateTime(recentEntry?.openedAt)}</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </article>

                    <div className="chooser-side-column">
                      <article className="panel chooser-panel">
                        <div className="panel-titlebar compact">
                          <div>
                            <p className="section-tag">{t("common.create")}</p>
                            <h3>{t("projects.newProject")}</h3>
                          </div>
                        </div>
                        <form className="form-stack chooser-form" onSubmit={(event) => void handleCreateProject(event)}>
                          <label className="field-block">
                            <span className="field-label">{t("projects.projectTitle")}</span>
                            <input required className="input-field" placeholder={t("projects.newProject")} value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
                          </label>
                          <label className="field-block">
                            <span className="field-label">{t("projects.projectDescription")}</span>
                            <input className="input-field" placeholder={t("projects.projectDescription")} value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} />
                          </label>
                          <label className="field-block compact-field">
                            <span className="field-label">{t("projects.phase")}</span>
                            <select className="input-field" value={projectStatus} onChange={(event) => setProjectStatus(event.target.value as ProjectStatus)}>
                              <option value="pre">{t("projects.preparation")}</option>
                              <option value="production">{t("projects.filming")}</option>
                              <option value="post">{t("projects.postProduction")}</option>
                            </select>
                          </label>
                          <button className="action-primary" type="submit">{t("projects.createProject")}</button>
                        </form>
                      </article>

                      <article className="panel chooser-panel">
                        <div className="panel-titlebar compact">
                          <div>
                            <p className="section-tag">{t("sidebar.domains")}</p>
                            <h3>{t("sidebar.referenceRadar")}</h3>
                          </div>
                        </div>
                        <div className="reference-grid">
                          {REFERENCE_AREAS.map((area) => (
                            <div key={area.nameKey} className="reference-card">
                              <div className="reference-card-top">
                                <strong>{t(area.nameKey)}</strong>
                                <span className={`reference-badge reference-badge-${area.status.replace(" ", "-").toLowerCase()}`}>{area.status}</span>
                              </div>
                              <p>{t(area.summaryKey)}</p>
                            </div>
                          ))}
                        </div>
                      </article>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {projectId ? (
              <section className="summary-strip panel">
                <div className="summary-cell">
                  <span className="summary-label">{t("dashboard.totalBudget")}</span>
                  <strong className="summary-value">{loading ? "..." : formatMoney(totalBudget)}</strong>
                </div>
                <div className="summary-cell">
                  <span className="summary-label">{t("dashboard.actualCosts")}</span>
                  <strong className="summary-value">{loading ? "..." : formatMoney(totalSpent)}</strong>
                </div>
                <div className="summary-cell">
                  <span className="summary-label">{t("dashboard.balance")}</span>
                  <strong className={`summary-value ${remainingBudget < 0 ? "summary-danger" : "summary-success"}`}>{loading ? "..." : formatMoney(remainingBudget)}</strong>
                </div>
                <div className="summary-cell">
                  <span className="summary-label">{t("dashboard.shootDays")}</span>
                  <strong className="summary-value">{shootDays.length}</strong>
                </div>
              </section>
            ) : null}

            {!projectId ? <div className="panel empty-panel">{t("projects.selectOrCreateFirst")}</div> : null}

            {projectId && view === "dashboard" ? (
              <section className="content-grid content-grid-dashboard">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("sections.budgetWindow")}</p>
                      <h3>{t("sections.budgetByCostCenter")}</h3>
                    </div>
                    <button className="action-ghost" onClick={() => setView("budget")}>{t("common.edit")}</button>
                  </div>
                  <div className="table-toolbar">
                    <span>{costCenters.length} {t("columns.positions")}</span>
                    <span>{t("export.values")}: {selectedCurrency}</span>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>{t("columns.costCenter")}</th>
                          <th className="align-right">{t("columns.budget")}</th>
                          <th className="align-right">{t("columns.isAmountShort")}</th>
                          <th className="align-right">{t("columns.difference")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costCenters.map((center) => {
                          const delta = center.budget - center.spent;
                          return (
                            <tr key={center.id}>
                              <td>{center.name}</td>
                              <td className="align-right font-mono-data">{formatMoney(center.budget)}</td>
                              <td className="align-right font-mono-data">{formatMoney(center.spent)}</td>
                              <td className={`align-right font-mono-data ${delta < 0 ? "table-negative" : "table-positive"}`}>{formatMoney(delta)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </article>

                {activeProject && (
                  <article className="panel window-panel export-panel">
                    <div className="panel-titlebar">
                      <div>
                        <p className="section-tag">{t("export.title")}</p>
                        <h3>{t("export.exportTitle")}</h3>
                      </div>
                    </div>
                    <div style={{ padding: '10px' }}>
                      <ExportButtons
                        projectTitle={activeProject.title}
                        projectDescription={activeProject.description ?? undefined}
                        costAccountingData={costAccountingData}
                        shootDays={shootDays}
                        currency={selectedCurrency}
                        locale={activeLocale}
                        activeModule="all"
                      />
                    </div>
                  </article>
                )}

                <div className="subgrid">
                  <article className="panel window-panel">
                    <div className="panel-titlebar compact">
                      <div>
                        <p className="section-tag">{t("navigation.shootPlan")}</p>
                        <h3>{t("sections.nextShootDays")}</h3>
                      </div>
                    </div>
                    <ul className="info-list">
                      {nextShootDays.length === 0 && !loading ? <li className="muted-item">{t("sections.noShootDaysPlanned")}</li> : null}
                      {nextShootDays.map((day) => (
                        <li key={day.id}>
                          <span>{formatDate(day.date)}</span>
                          <strong>{day.location ?? t("common.open")}</strong>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="panel window-panel">
                    <div className="panel-titlebar compact">
                      <div>
                        <p className="section-tag">{t("sections.focus")}</p>
                        <h3>{t("sections.topCostCenters")}</h3>
                      </div>
                    </div>
                    <ul className="info-list ranked-list">
                      {topCostCenters.map((item, index) => (
                        <li key={item.id}>
                          <span>#{index + 1} {item.name}</span>
                          <strong className="font-mono-data">{formatMoney(item.spent)}</strong>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              </section>
            ) : null}

            {projectId && view === "budget" ? (
              <section className="content-grid content-grid-editor">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("common.edit")}</p>
                      <h3>{t("budget.editBudget")}</h3>
                    </div>
                    <span className="title-hint">{t("budget.editHint")}</span>
                  </div>
                  <div className="table-toolbar">
                    <span>{t("budget.enterToSave")}</span>
                    <span>{t("budget.escapeToCancel")}</span>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th style={{ width: 28 }} />
                          <th>{t("columns.costCenter")}</th>
                          <th className="align-right">{t("columns.budget")}</th>
                          <th className="align-right">{t("columns.isAmountShort")}</th>
                          <th className="align-right">{t("columns.difference")}</th>
                          <th className="align-right">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costCenters.map((center) => {
                          const isEditing = editingCell?.id === center.id;
                          const delta = center.budget - center.spent;
                          const isExpanded = expandedCostCenterIds.has(center.id);
                          const positions = costPositions.filter((p) => p.costCenterId === center.id && !p.parentId);
                          return (
                            <>
                              <tr key={center.id} className={freshlySavedId === center.id ? "edit-flash" : undefined}>
                                <td>
                                  {positions.length > 0 ? (
                                    <button className="expand-toggle" onClick={() => toggleCostCenterExpanded(center.id)} title={isExpanded ? t("common.cancel") : t("columns.positions")}>
                                      {isExpanded ? "▼" : "▶"}
                                    </button>
                                  ) : null}
                                </td>
                                <td>{center.name}</td>
                                <td className="align-right font-mono-data">
                                  {isEditing ? (
                                    <input
                                      autoFocus
                                      className="input-field inline-editor"
                                      value={editingCell.draftValue}
                                      onChange={(event) => setEditingCell({ id: center.id, draftValue: event.target.value })}
                                      onBlur={() => void saveBudgetEdit(center.id)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") void saveBudgetEdit(center.id);
                                        if (event.key === "Escape") cancelBudgetEdit();
                                      }}
                                    />
                                  ) : (
                                    <button className="grid-link" onClick={() => startBudgetEdit(center)}>{formatMoney(center.budget)}</button>
                                  )}
                                </td>
                                <td className="align-right font-mono-data">{formatMoney(center.spent)}</td>
                                <td className={`align-right font-mono-data ${delta < 0 ? "table-negative" : "table-positive"}`}>{formatMoney(delta)}</td>
                                <td className="align-right">
                                  <button className="grid-delete" onClick={() => void handleDeleteCostCenter(center.id, center.name)} title={t("costCenters.deleteCostCenter")}>✕</button>
                                </td>
                              </tr>
                              {isExpanded && positions.map((pos) => {
                                const qty = Number(pos.quantity);
                                const rate = Number(pos.unitRate);
                                const amount = qty * rate;
                                return (
                                  <tr key={pos.id} className="position-subrow">
                                    <td />
                                    <td style={{ paddingLeft: "1.5rem" }}>↳ {pos.name}{pos.notes ? <span className="subrow-note"> — {pos.notes}</span> : null}</td>
                                    <td className="align-right font-mono-data">{qty} × {formatMoney(rate)}</td>
                                    <td className="align-right font-mono-data">{formatMoney(amount)}</td>
                                    <td />
                                    <td className="align-right">
                                      <button className="grid-delete" onClick={() => void handleDeleteCostPosition(pos.id)} title={t("common.delete")}>✕</button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel form-panel">
                  <div className="panel-titlebar compact">
                    <div>
                      <p className="section-tag">{t("common.create")}</p>
                      <h3>{t("costCenters.createCostCenter")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateCostCenter(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("costCenters.name")}</span>
                      <input required className="input-field" placeholder={t("costCenters.name")} value={costCenterName} onChange={(event) => setCostCenterName(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.budget")}</span>
                      <input required min="0" step="0.01" type="number" className="input-field" placeholder="0.00" value={costCenterBudget} onChange={(event) => setCostCenterBudget(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("budget.savePosition")}</button>
                  </form>

                  <div className="panel-titlebar compact" style={{ marginTop: 20 }}>
                    <div>
                      <p className="section-tag">{t("costPositions.add")}</p>
                      <h3>{t("costPositions.title")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateCostPosition(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("columns.costCenter")}</span>
                      <select required className="input-field" value={positionCostCenterId} onChange={(event) => setPositionCostCenterId(event.target.value)}>
                        <option value="">{t("projects.selectProject")}</option>
                        {costCenters.map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                      </select>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("costPositions.name")}</span>
                      <input required className="input-field" placeholder={t("costPositions.name")} value={positionName} onChange={(event) => setPositionName(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("costPositions.quantity")}</span>
                      <input required min="0" step="any" type="number" className="input-field" placeholder="1" value={positionQuantity} onChange={(event) => setPositionQuantity(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("costPositions.unitRate")}</span>
                      <input required min="0" step="0.01" type="number" className="input-field" placeholder="0.00" value={positionUnitRate} onChange={(event) => setPositionUnitRate(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.notes")}</span>
                      <input className="input-field" placeholder={t("columns.notes")} value={positionNotes} onChange={(event) => setPositionNotes(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("costPositions.add")}</button>
                  </form>

                  <div className="panel-titlebar compact" style={{ marginTop: 20 }}>
                    <div>
                      <p className="section-tag">{t("budgetScenarios.tag")}</p>
                      <h3>{t("budgetScenarios.title")}</h3>
                    </div>
                  </div>
                  <div className="field-block">
                    <span className="field-label">{t("columns.costCenter")}</span>
                    <select className="input-field" value={selectedScenarioCostCenterId} onChange={(event) => {
                      setSelectedScenarioCostCenterId(event.target.value);
                      if (event.target.value) void loadScenarios(event.target.value);
                      else setScenarios([]);
                    }}>
                      <option value="">{t("projects.selectProject")}</option>
                      {costCenters.map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                    </select>
                  </div>
                  {selectedScenarioCostCenterId ? (
                    <>
                      <div className="scenario-list">
                        {scenarios.length === 0 ? (
                          <p className="hint-text">{t("budgetScenarios.noScenarios")}</p>
                        ) : scenarios.map((s) => (
                          <div key={s.id} className="scenario-item">
                            <div className="scenario-item-info">
                              <strong>{s.name}</strong>
                              <span className="font-mono-data">{formatMoney(Number(s.amount))}</span>
                              {s.notes ? <small>{s.notes}</small> : null}
                            </div>
                            <button className="grid-delete" onClick={() => void handleDeleteScenario(s.id)} title={t("common.delete")}>✕</button>
                          </div>
                        ))}
                      </div>
                      <form className="form-stack" onSubmit={(event) => void handleCreateScenario(event)}>
                        <label className="field-block">
                          <span className="field-label">{t("budgetScenarios.scenarioName")}</span>
                          <input required className="input-field" placeholder={t("budgetScenarios.scenarioName")} value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} />
                        </label>
                        <label className="field-block">
                          <span className="field-label">{t("columns.amount")}</span>
                          <input required min="0" step="0.01" type="number" className="input-field" placeholder="0.00" value={scenarioAmount} onChange={(event) => setScenarioAmount(event.target.value)} />
                        </label>
                        <label className="field-block">
                          <span className="field-label">{t("columns.notes")}</span>
                          <input className="input-field" placeholder={t("columns.notes")} value={scenarioNotes} onChange={(event) => setScenarioNotes(event.target.value)} />
                        </label>
                        <button className="action-primary" type="submit">{t("budgetScenarios.addScenario")}</button>
                      </form>
                    </>
                  ) : null}
                </article>
              </section>
            ) : null}

            {projectId && view === "expenses" ? (
              <section className="content-grid content-grid-editor">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("navigation.expenses")}</p>
                      <h3>{t("expenses.bookedExpenses")}</h3>
                    </div>
                    <span className="title-hint">{t("expenses.assignmentHint")}</span>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>{t("columns.description")}</th>
                          <th>{t("columns.costCenter")}</th>
                          <th>{t("columns.date")}</th>
                          <th className="align-right">{t("columns.amount")}</th>
                          <th className="align-right">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((expense) => (
                          <tr key={expense.id}>
                            <td>{expense.description ?? "-"}</td>
                            <td>{expense.costCenter?.name ?? t("expenses.withoutCostCenter")}</td>
                            <td>{expense.expenseDate ? formatDate(expense.expenseDate) : "-"}</td>
                            <td className="align-right font-mono-data">{formatMoney(Number(expense.amount))}</td>
                            <td className="align-right">
                              <button className="grid-delete" onClick={() => void handleDeleteExpense(expense.id)} title={t("expenses.deleteExpense")}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel form-panel">
                  <div className="panel-titlebar compact">
                    <div>
                      <p className="section-tag">{t("common.create")}</p>
                      <h3>{t("expenses.createExpense")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateExpense(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("columns.amount")}</span>
                      <input required min="0.01" step="0.01" type="number" className="input-field" placeholder="0.00" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.description")}</span>
                      <input className="input-field" placeholder={t("columns.description")} value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.costCenter")}</span>
                      <select className="input-field" value={expenseCostCenterId} onChange={(event) => setExpenseCostCenterId(event.target.value)}>
                        <option value="">{t("expenses.withoutCostCenter")}</option>
                        {costCenters.map((costCenter) => <option key={costCenter.id} value={costCenter.id}>{costCenter.name}</option>)}
                      </select>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("expenses.receiptDate")}</span>
                      <input className="input-field" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("expenses.bookExpense")}</button>
                  </form>
                </article>
              </section>
            ) : null}

            {projectId && view === "shootDays" ? (
              <section className="content-grid content-grid-editor">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("navigation.shootPlan")}</p>
                      <h3>{t("shootDays.title")}</h3>
                    </div>
                    <span className="title-hint">{t("shootDays.tableHint")}</span>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>{t("columns.date")}</th>
                          <th>{t("columns.location")}</th>
                          <th>{t("shootDays.locationOwner")}</th>
                          <th>{t("shootDays.locationContactPerson")}</th>
                          <th>{t("columns.notes")}</th>
                          <th className="align-right">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shootDays.map((shootDay) => (
                          <tr key={shootDay.id}>
                            <td>{formatDate(shootDay.date)}</td>
                            <td>{shootDay.location ?? "-"}</td>
                            <td>{shootDay.locationOwner ?? "-"}</td>
                            <td>{shootDay.locationContactPerson ?? "-"}</td>
                            <td>{shootDay.notes ?? "-"}</td>
                            <td className="align-right">
                              <button className="grid-delete" onClick={() => void handleDeleteShootDay(shootDay.id, formatDate(shootDay.date))} title={t("shootDays.deleteShootDay")}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel form-panel">
                  <div className="panel-titlebar compact">
                    <div>
                      <p className="section-tag">{t("common.edit")}</p>
                      <h3>{t("shootDays.newShootDay")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateShootDay(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("shootDays.date")}</span>
                      <input required className="input-field" type="date" value={shootDayDate} onChange={(event) => setShootDayDate(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("shootDays.location")}</span>
                      <input className="input-field" placeholder={t("shootDays.location")} value={shootDayLocation} onChange={(event) => setShootDayLocation(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("shootDays.locationOwner")}</span>
                      <input className="input-field" placeholder={t("shootDays.locationOwner")} value={shootDayLocationOwner} onChange={(event) => setShootDayLocationOwner(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("shootDays.locationContactPerson")}</span>
                      <input className="input-field" placeholder={t("shootDays.locationContactPerson")} value={shootDayLocationContactPerson} onChange={(event) => setShootDayLocationContactPerson(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("shootDays.notes")}</span>
                      <textarea className="input-field notes-area" placeholder={t("shootDays.notes")} value={shootDayNotes} onChange={(event) => setShootDayNotes(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("shootDays.createShootDay")}</button>
                  </form>
                </article>
              </section>
            ) : null}

            {projectId && view === "contacts" ? (
              <section className="content-grid content-grid-editor">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("navigation.contacts")}</p>
                      <h3>{t("contacts.title")}</h3>
                    </div>
                    <span className="title-hint">{t("contacts.calendarHint")}</span>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>{t("contacts.name")}</th>
                          <th>{t("contacts.category")}</th>
                          <th>{t("contacts.email")}</th>
                          <th>{t("contacts.phone")}</th>
                          <th>{t("columns.notes")}</th>
                          <th className="align-right">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.length === 0 ? (
                          <tr>
                            <td colSpan={6}>{t("contacts.noContacts")}</td>
                          </tr>
                        ) : (
                          contacts.map((contact) => (
                            <tr key={contact.id}>
                              <td>{contact.fullName}</td>
                              <td>{formatContactCategory(contact.category)}</td>
                              <td>{contact.email ?? "-"}</td>
                              <td>{contact.phone ?? "-"}</td>
                              <td>{contact.notes ?? "-"}</td>
                              <td className="align-right">
                                <button className="grid-delete" onClick={() => void handleDeleteContact(contact.id)} title={t("common.delete")}>✕</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="panel-titlebar compact" style={{ marginTop: 14 }}>
                    <div>
                      <p className="section-tag">{t("contacts.calendar")}</p>
                      <h3>{t("contacts.calendar")}</h3>
                    </div>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>{t("columns.date")}</th>
                          <th>{t("contacts.time")}</th>
                          <th>{t("contacts.appointmentTitle")}</th>
                          <th>{t("columns.location")}</th>
                          <th>{t("contacts.contactPerson")}</th>
                          <th>{t("columns.notes")}</th>
                          <th className="align-right">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointmentCalendar.length === 0 ? (
                          <tr>
                            <td colSpan={7}>{t("contacts.noAppointments")}</td>
                          </tr>
                        ) : (
                          appointmentCalendar.flatMap((group) =>
                            group.items.map((appointment, index) => (
                              <tr key={appointment.id}>
                                <td>{index === 0 ? formatDate(group.date) : ""}</td>
                                <td>
                                  {new Date(appointment.startAt).toLocaleTimeString(activeLocale, { hour: "2-digit", minute: "2-digit" })}
                                  {appointment.endAt
                                    ? ` - ${new Date(appointment.endAt).toLocaleTimeString(activeLocale, { hour: "2-digit", minute: "2-digit" })}`
                                    : ""}
                                </td>
                                <td>{appointment.title}</td>
                                <td>{appointment.location ?? "-"}</td>
                                <td>{appointment.contact?.fullName ?? "-"}</td>
                                <td>{appointment.notes ?? "-"}</td>
                                <td className="align-right">
                                  <button className="grid-delete" onClick={() => void handleDeleteAppointment(appointment.id)} title={t("common.delete")}>✕</button>
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel form-panel">
                  <div className="panel-titlebar compact">
                    <div>
                      <p className="section-tag">{t("common.create")}</p>
                      <h3>{t("contacts.createContact")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateContact(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.name")}</span>
                      <input required className="input-field" placeholder={t("contacts.name")} value={contactName} onChange={(event) => setContactName(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.category")}</span>
                      <select className="input-field" value={contactCategory} onChange={(event) => setContactCategory(event.target.value as ContactCategory)}>
                        <option value="crew">{t("contacts.categoryCrew")}</option>
                        <option value="cast">{t("contacts.categoryCast")}</option>
                        <option value="other">{t("contacts.categoryOther")}</option>
                      </select>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.email")}</span>
                      <input className="input-field" placeholder={t("contacts.email")} value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.phone")}</span>
                      <input className="input-field" placeholder={t("contacts.phone")} value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.notes")}</span>
                      <textarea className="input-field notes-area" placeholder={t("columns.notes")} value={contactNotes} onChange={(event) => setContactNotes(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("contacts.createContact")}</button>
                  </form>

                  <div className="panel-titlebar compact" style={{ marginTop: 14 }}>
                    <div>
                      <p className="section-tag">{t("contacts.createAppointment")}</p>
                      <h3>{t("contacts.createAppointment")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateAppointment(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.appointmentTitle")}</span>
                      <input required className="input-field" placeholder={t("contacts.appointmentTitle")} value={appointmentTitle} onChange={(event) => setAppointmentTitle(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.startAt")}</span>
                      <input required className="input-field" type="datetime-local" value={appointmentStartAt} onChange={(event) => setAppointmentStartAt(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.endAt")}</span>
                      <input className="input-field" type="datetime-local" value={appointmentEndAt} onChange={(event) => { setAppointmentEndAt(event.target.value); setAppointmentError(null); }} />
                    </label>
                    {appointmentError ? <p className="form-error">{appointmentError}</p> : null}
                    <label className="field-block">
                      <span className="field-label">{t("columns.location")}</span>
                      <input className="input-field" placeholder={t("columns.location")} value={appointmentLocation} onChange={(event) => setAppointmentLocation(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.contactPerson")}</span>
                      <select className="input-field" value={appointmentContactId} onChange={(event) => setAppointmentContactId(event.target.value)}>
                        <option value="">{t("common.open")}</option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>{contact.fullName}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.notes")}</span>
                      <textarea className="input-field notes-area" placeholder={t("columns.notes")} value={appointmentNotes} onChange={(event) => setAppointmentNotes(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("contacts.createAppointment")}</button>
                  </form>
                </article>
              </section>
            ) : null}

            {projectId && view === "contracts" ? (
              <section className="content-grid content-grid-editor">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("navigation.contracts")}</p>
                      <h3>{t("contracts.title")}</h3>
                    </div>
                    <span className="title-hint">{t("contracts.hint")}</span>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>{t("contracts.contractTitle")}</th>
                          <th>{t("contracts.type")}</th>
                          <th>{t("contracts.status")}</th>
                          <th>{t("contacts.contactPerson")}</th>
                          <th>{t("contracts.validFrom")}</th>
                          <th>{t("contracts.validTo")}</th>
                          <th className="align-right">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.length === 0 ? (
                          <tr>
                            <td colSpan={7}>{t("contracts.noContracts")}</td>
                          </tr>
                        ) : (
                          contracts.map((contract) => (
                            <tr key={contract.id}>
                              <td>{contract.title}</td>
                              <td>{contract.contractType}</td>
                              <td>{t(`contracts.status_${contract.status}`)}</td>
                              <td>{contract.contact?.fullName ?? "-"}</td>
                              <td>{contract.validFrom ? formatDate(contract.validFrom) : "-"}</td>
                              <td>{contract.validTo ? formatDate(contract.validTo) : "-"}</td>
                              <td className="align-right">
                                <button className="grid-delete" onClick={() => void handleDeleteContract(contract.id)} title={t("common.delete")}>✕</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel form-panel">
                  <div className="panel-titlebar compact">
                    <div>
                      <p className="section-tag">{t("common.create")}</p>
                      <h3>{t("contracts.createContract")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateContract(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("contracts.contractTitle")}</span>
                      <input required className="input-field" value={contractTitle} onChange={(event) => setContractTitle(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contracts.type")}</span>
                      <input required className="input-field" value={contractType} onChange={(event) => setContractType(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contracts.status")}</span>
                      <select className="input-field" value={contractStatus} onChange={(event) => setContractStatus(event.target.value as ContractStatus)}>
                        <option value="draft">{t("contracts.status_draft")}</option>
                        <option value="active">{t("contracts.status_active")}</option>
                        <option value="expired">{t("contracts.status_expired")}</option>
                        <option value="terminated">{t("contracts.status_terminated")}</option>
                      </select>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.contactPerson")}</span>
                      <select className="input-field" value={contractContactId} onChange={(event) => setContractContactId(event.target.value)}>
                        <option value="">{t("common.open")}</option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>{contact.fullName}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contracts.validFrom")}</span>
                      <input className="input-field" type="date" value={contractValidFrom} onChange={(event) => setContractValidFrom(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contracts.validTo")}</span>
                      <input className="input-field" type="date" value={contractValidTo} onChange={(event) => setContractValidTo(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.notes")}</span>
                      <textarea className="input-field notes-area" value={contractNotes} onChange={(event) => setContractNotes(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("contracts.createContract")}</button>
                  </form>
                </article>
              </section>
            ) : null}

            {projectId && view === "timeTracking" ? (
              <section className="content-grid content-grid-editor">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("navigation.timeTracking")}</p>
                      <h3>{t("timeTracking.title")}</h3>
                    </div>
                    <span className="title-hint">{t("timeTracking.hint")}</span>
                  </div>
                  <div className="data-grid-wrap">
                    <table className="data-grid">
                      <thead>
                        <tr>
                          <th>{t("columns.date")}</th>
                          <th>{t("contacts.contactPerson")}</th>
                          <th>{t("timeTracking.activity")}</th>
                          <th>{t("timeTracking.period")}</th>
                          <th>{t("timeTracking.breakMinutes")}</th>
                          <th>{t("timeTracking.hours")}</th>
                          <th>{t("timeTracking.approved")}</th>
                          <th className="align-right">{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeEntries.length === 0 ? (
                          <tr>
                            <td colSpan={8}>{t("timeTracking.noEntries")}</td>
                          </tr>
                        ) : (
                          timeEntries.map((entry) => (
                            <tr key={entry.id}>
                              <td>{formatDate(entry.workDate)}</td>
                              <td>{entry.contact?.fullName ?? "-"}</td>
                              <td>{entry.activity}</td>
                              <td>{entry.startTime && entry.endTime ? `${entry.startTime} - ${entry.endTime}` : "-"}</td>
                              <td>{entry.breakMinutes}</td>
                              <td>{Number(entry.hours).toFixed(2)}</td>
                              <td>{entry.approved ? t("common.yes") : t("common.no")}</td>
                              <td className="align-right">
                                <button className="grid-delete" onClick={() => void handleDeleteTimeEntry(entry.id)} title={t("common.delete")}>✕</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="panel form-panel">
                  <div className="panel-titlebar compact">
                    <div>
                      <p className="section-tag">{t("common.create")}</p>
                      <h3>{t("timeTracking.createEntry")}</h3>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={(event) => void handleCreateTimeEntry(event)}>
                    <label className="field-block">
                      <span className="field-label">{t("columns.date")}</span>
                      <input required className="input-field" type="date" value={timeEntryDate} onChange={(event) => setTimeEntryDate(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.contactPerson")}</span>
                      <select className="input-field" value={timeEntryContactId} onChange={(event) => setTimeEntryContactId(event.target.value)}>
                        <option value="">{t("common.open")}</option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>{contact.fullName}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("timeTracking.activity")}</span>
                      <input required className="input-field" value={timeEntryActivity} onChange={(event) => setTimeEntryActivity(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("disposition.callTime")}</span>
                      <input className="input-field" type="time" value={timeEntryStart} onChange={(event) => setTimeEntryStart(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("contacts.endAt")}</span>
                      <input className="input-field" type="time" value={timeEntryEnd} onChange={(event) => setTimeEntryEnd(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("timeTracking.breakMinutes")}</span>
                      <input className="input-field" type="number" min={0} value={timeEntryBreakMinutes} onChange={(event) => setTimeEntryBreakMinutes(event.target.value)} />
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("timeTracking.hours")}</span>
                      <input className="input-field" type="number" min={0} step="0.25" value={timeEntryHours} onChange={(event) => setTimeEntryHours(event.target.value)} />
                    </label>
                    <label className="field-block" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={timeEntryApproved} onChange={(event) => setTimeEntryApproved(event.target.checked)} />
                      <span className="field-label">{t("timeTracking.approved")}</span>
                    </label>
                    <label className="field-block">
                      <span className="field-label">{t("columns.notes")}</span>
                      <textarea className="input-field notes-area" value={timeEntryNotes} onChange={(event) => setTimeEntryNotes(event.target.value)} />
                    </label>
                    <button className="action-primary" type="submit">{t("timeTracking.createEntry")}</button>
                  </form>
                </article>
              </section>
            ) : null}

            {projectId && view === "disposition" ? (
              <section className="content-grid content-grid-editor">
                <article className="panel window-panel">
                  <div className="panel-titlebar">
                    <div>
                      <p className="section-tag">{t("navigation.disposition")}</p>
                      <h3>{t("disposition.title")}</h3>
                    </div>
                    {selectedDisposition ? (
                      <div className="export-buttons">
                        <button className="export-btn" onClick={() => void handleExportDisposition(selectedDisposition)}>{t("disposition.exportPdf")}</button>
                        <button className="export-btn secondary" onClick={() => handlePrintDisposition(selectedDisposition)}>{t("disposition.printPreview")}</button>
                      </div>
                    ) : null}
                  </div>

                  <div className="table-toolbar">
                    <span>{t("disposition.selectShootDay")}</span>
                    <select
                      className="input-field"
                      value={selectedDisposition?.shootDayId ?? ""}
                      onChange={(event) => { setSelectedDispositionId(event.target.value); setDispoTab("activities"); }}
                      style={{ maxWidth: 260 }}
                    >
                      {dispositions.map((item) => (
                        <option key={item.shootDayId} value={item.shootDayId}>
                          {formatDate(item.date)} - {item.location ?? t("common.open")}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedDisposition ? (
                    <div className="empty-panel">{t("disposition.noDispositions")}</div>
                  ) : (
                    <div style={{ padding: 16, display: "grid", gap: 14 }}>
                      <div className="summary-strip" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
                        <div className="summary-cell">
                          <span className="summary-label">{t("columns.date")}</span>
                          <strong className="summary-value" style={{ fontSize: "1.1rem" }}>{formatDate(selectedDisposition.date)}</strong>
                        </div>
                        <div className="summary-cell">
                          <span className="summary-label">{t("columns.location")}</span>
                          <strong className="summary-value" style={{ fontSize: "1.1rem" }}>{selectedDisposition.location ?? "-"}</strong>
                        </div>
                        <div className="summary-cell">
                          <span className="summary-label">{t("disposition.callTime")}</span>
                          <strong className="summary-value" style={{ fontSize: "1.1rem" }}>{selectedDisposition.callTime ?? "-"}</strong>
                        </div>
                        <div className="summary-cell">
                          <span className="summary-label">{t("disposition.weather")}</span>
                          <strong className="summary-value" style={{ fontSize: "1.1rem" }}>{selectedDisposition.weather ?? t("disposition.notSet")}</strong>
                        </div>
                        <div className="summary-cell">
                          <span className="summary-label">{t("shootDays.locationOwner")}</span>
                          <strong className="summary-value" style={{ fontSize: "1.1rem" }}>{selectedDisposition.locationOwner ?? "-"}</strong>
                        </div>
                        <div className="summary-cell">
                          <span className="summary-label">{t("shootDays.locationContactPerson")}</span>
                          <strong className="summary-value" style={{ fontSize: "1.1rem" }}>{selectedDisposition.locationContactPerson ?? "-"}</strong>
                        </div>
                      </div>

                      <div className="dispo-meta-grid">
                        <label className="field-block">
                          <span className="field-label">{t("disposition.callTime")}</span>
                          <input className="input-field" placeholder="07:30" value={dispoCallTime} onChange={(event) => setDispoCallTime(event.target.value)} />
                        </label>
                        <label className="field-block">
                          <span className="field-label">{t("disposition.weather")}</span>
                          <input className="input-field" placeholder={t("disposition.weatherPlaceholder")} value={dispoWeather} onChange={(event) => setDispoWeather(event.target.value)} />
                        </label>
                        <label className="field-block">
                          <span className="field-label">{t("disposition.generalNotes")}</span>
                          <input className="input-field" placeholder={t("disposition.generalNotesPlaceholder")} value={dispoGeneralNotes} onChange={(event) => setDispoGeneralNotes(event.target.value)} />
                        </label>
                        <button className="action-primary align-end" onClick={() => void handleSaveDispositionMeta()}>{t("disposition.saveMeta")}</button>
                      </div>

                      {/* Tab navigation */}
                      <div className="tab-bar">
                        <button className={`tab-btn${dispoTab === "activities" ? " active" : ""}`} onClick={() => setDispoTab("activities")}>{t("disposition.tabActivities")}</button>
                        <button className={`tab-btn${dispoTab === "scenes" ? " active" : ""}`} onClick={() => setDispoTab("scenes")}>{t("disposition.tabScenes")} ({selectedDisposition.scenes.length})</button>
                        <button className={`tab-btn${dispoTab === "crew" ? " active" : ""}`} onClick={() => setDispoTab("crew")}>{t("disposition.tabCrew")} ({selectedDisposition.crewAssignments.length})</button>
                        <button className={`tab-btn${dispoTab === "cast" ? " active" : ""}`} onClick={() => setDispoTab("cast")}>{t("disposition.tabCast")} ({selectedDisposition.castAssignments.length})</button>
                      </div>

                      {/* Activities tab */}
                      {dispoTab === "activities" ? (
                        <article className="panel window-panel">
                          <div className="panel-titlebar compact">
                            <div><p className="section-tag">{t("disposition.tabActivities")}</p><h3>{t("disposition.sceneTableTitle")}</h3></div>
                          </div>
                          <div className="data-grid-wrap">
                            <table className="data-grid">
                              <thead><tr><th>{t("disposition.time")}</th><th>{t("disposition.scene")}</th><th>{t("disposition.crew")}</th><th>{t("disposition.transport")}</th><th>{t("disposition.equipment")}</th><th>{t("disposition.catering")}</th><th>{t("columns.notes")}</th><th className="align-right">{t("common.actions")}</th></tr></thead>
                              <tbody>
                                {selectedDisposition.activities.length === 0 ? (
                                  <tr><td colSpan={8}>{t("disposition.noActivities")}</td></tr>
                                ) : (
                                  selectedDisposition.activities.map((activity) =>
                                    editingActivityId === activity.id ? (
                                      <tr key={activity.id} style={{ background: "var(--surface-2, rgba(255,255,255,0.04))" }}>
                                        <td><input className="input-field" style={{ width: 80 }} value={editActivityTime} onChange={(e) => setEditActivityTime(e.target.value)} placeholder={t("disposition.time")} /></td>
                                        <td><input className="input-field" style={{ minWidth: 120 }} value={editActivityTitle} onChange={(e) => setEditActivityTitle(e.target.value)} placeholder={t("disposition.activityTitle")} /></td>
                                        <td><input className="input-field" style={{ minWidth: 100 }} value={editActivityCrew} onChange={(e) => setEditActivityCrew(e.target.value)} placeholder={t("disposition.crew")} /></td>
                                        <td><input className="input-field" style={{ minWidth: 90 }} value={editActivityTransport} onChange={(e) => setEditActivityTransport(e.target.value)} placeholder={t("disposition.transport")} /></td>
                                        <td><input className="input-field" style={{ minWidth: 90 }} value={editActivityEquipment} onChange={(e) => setEditActivityEquipment(e.target.value)} placeholder={t("disposition.equipment")} /></td>
                                        <td><input className="input-field" style={{ minWidth: 90 }} value={editActivityCatering} onChange={(e) => setEditActivityCatering(e.target.value)} placeholder={t("disposition.catering")} /></td>
                                        <td><input className="input-field" style={{ minWidth: 100 }} value={editActivityNotes} onChange={(e) => setEditActivityNotes(e.target.value)} placeholder={t("columns.notes")} /></td>
                                        <td className="align-right" style={{ whiteSpace: "nowrap" }}>
                                          <button className="action-primary" style={{ marginRight: 4 }} onClick={() => void handleSaveEditActivity()} disabled={!editActivityTitle.trim()} title={t("common.save")}>✓</button>
                                          <button className="grid-delete" onClick={handleCancelEditActivity} title={t("common.cancel")}>✕</button>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr key={activity.id}>
                                        <td>{activity.time ?? "-"}</td>
                                        <td>{activity.title}</td>
                                        <td>{activity.crew ?? "-"}</td>
                                        <td>{activity.transport ?? "-"}</td>
                                        <td>{activity.equipment ?? "-"}</td>
                                        <td>{activity.catering ?? "-"}</td>
                                        <td>{activity.notes ?? "-"}</td>
                                        <td className="align-right" style={{ whiteSpace: "nowrap" }}>
                                          <button className="grid-edit" style={{ marginRight: 4 }} onClick={() => handleStartEditActivity(activity)} title={t("common.edit")}>✎</button>
                                          <button className="grid-delete" onClick={() => void handleDeleteActivity(activity.id)} title={t("common.delete")}>✕</button>
                                        </td>
                                      </tr>
                                    )
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="form-inline" style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid var(--border)" }}>
                            <input className="input-field" style={{ width: 90 }} placeholder={t("disposition.time")} value={activityTime} onChange={(e) => setActivityTime(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 140 }} placeholder={t("disposition.activityTitle")} value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 120 }} placeholder={t("disposition.crew")} value={activityCrew} onChange={(e) => setActivityCrew(e.target.value)} />
                            <input className="input-field" style={{ flex: 1, minWidth: 90 }} placeholder={t("disposition.transport")} value={activityTransport} onChange={(e) => setActivityTransport(e.target.value)} />
                            <input className="input-field" style={{ flex: 1, minWidth: 90 }} placeholder={t("disposition.equipment")} value={activityEquipment} onChange={(e) => setActivityEquipment(e.target.value)} />
                            <input className="input-field" style={{ flex: 1, minWidth: 90 }} placeholder={t("disposition.catering")} value={activityCatering} onChange={(e) => setActivityCatering(e.target.value)} />
                            <input className="input-field" style={{ flex: 3, minWidth: 140 }} placeholder={t("columns.notes")} value={activityNotes} onChange={(e) => setActivityNotes(e.target.value)} />
                            <button className="action-primary" style={{ whiteSpace: "nowrap" }} onClick={() => void handleAddActivity()} disabled={!activityTitle.trim()}>{t("common.add")}</button>
                          </div>
                          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", color: "var(--text-2)", fontSize: "0.85rem" }}>
                            {selectedDisposition.notes || t("disposition.noGeneralNotes")}
                          </div>
                        </article>
                      ) : null}

                      {/* Scenes tab */}
                      {dispoTab === "scenes" ? (
                        <article className="panel window-panel">
                          <div className="panel-titlebar compact">
                            <div><p className="section-tag">{t("disposition.tabScenes")}</p><h3>{t("disposition.tabScenes")}</h3></div>
                          </div>
                          <div className="data-grid-wrap">
                            <table className="data-grid">
                              <thead><tr><th>#</th><th>{t("disposition.sceneTitle")}</th><th>{t("disposition.synopsis")}</th><th>{t("columns.location")}</th><th>{t("disposition.duration")}</th><th className="align-right">{t("common.actions")}</th></tr></thead>
                              <tbody>
                                {selectedDisposition.scenes.length === 0 ? (
                                  <tr><td colSpan={6}>{t("disposition.noScenes")}</td></tr>
                                ) : (
                                  selectedDisposition.scenes.map((scene) => (
                                    <tr key={scene.id}>
                                      <td><strong>{scene.sceneNumber}</strong></td>
                                      <td>{scene.title}</td>
                                      <td>{scene.synopsis ?? "-"}</td>
                                      <td>{scene.location ?? "-"}</td>
                                      <td>{scene.estimatedDuration != null ? `${scene.estimatedDuration} min` : "-"}</td>
                                      <td className="align-right"><button className="grid-delete" onClick={() => void handleDeleteScene(scene.id)} title={t("common.delete")}>✕</button></td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="form-inline" style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid var(--border)" }}>
                            <input className="input-field" style={{ width: 60 }} placeholder="#" value={sceneNumber} onChange={(e) => setSceneNumber(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 120 }} placeholder={t("disposition.sceneTitle")} value={sceneTitle} onChange={(e) => setSceneTitle(e.target.value)} />
                            <input className="input-field" style={{ flex: 3, minWidth: 140 }} placeholder={t("disposition.synopsis")} value={sceneSynopsis} onChange={(e) => setSceneSynopsis(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 100 }} placeholder={t("columns.location")} value={sceneLocation} onChange={(e) => setSceneLocation(e.target.value)} />
                            <input className="input-field" style={{ width: 70 }} placeholder="min" type="number" min={1} value={sceneEstimatedDuration} onChange={(e) => setSceneEstimatedDuration(e.target.value)} />
                            <button className="action-primary" style={{ whiteSpace: "nowrap" }} onClick={() => void handleAddScene()} disabled={!sceneNumber.trim() || !sceneTitle.trim()}>{t("common.add")}</button>
                          </div>
                        </article>
                      ) : null}

                      {/* Crew tab */}
                      {dispoTab === "crew" ? (
                        <article className="panel window-panel">
                          <div className="panel-titlebar compact">
                            <div><p className="section-tag">{t("disposition.tabCrew")}</p><h3>{t("disposition.tabCrew")}</h3></div>
                          </div>
                          <div className="data-grid-wrap">
                            <table className="data-grid">
                              <thead><tr><th>{t("disposition.crewName")}</th><th>{t("disposition.crewRole")}</th><th>{t("disposition.callTime")}</th><th>{t("disposition.wrapTime")}</th><th>{t("columns.notes")}</th><th className="align-right">{t("common.actions")}</th></tr></thead>
                              <tbody>
                                {selectedDisposition.crewAssignments.length === 0 ? (
                                  <tr><td colSpan={6}>{t("disposition.noCrew")}</td></tr>
                                ) : (
                                  selectedDisposition.crewAssignments.map((crew) => (
                                    <tr key={crew.id}>
                                      <td>{crew.name}</td>
                                      <td>{crew.role ?? "-"}</td>
                                      <td>{crew.callTime ?? "-"}</td>
                                      <td>{crew.wrapTime ?? "-"}</td>
                                      <td>{crew.notes ?? "-"}</td>
                                      <td className="align-right"><button className="grid-delete" onClick={() => void handleDeleteCrewMember(crew.id)} title={t("common.delete")}>✕</button></td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="form-inline" style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid var(--border)" }}>
                            <input className="input-field" style={{ flex: 2, minWidth: 120 }} placeholder={t("disposition.crewName")} value={crewName} onChange={(e) => setCrewName(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 100 }} placeholder={t("disposition.crewRole")} value={crewRole} onChange={(e) => setCrewRole(e.target.value)} />
                            <input className="input-field" style={{ width: 90 }} placeholder={t("disposition.callTime")} value={crewCallTime} onChange={(e) => setCrewCallTime(e.target.value)} />
                            <input className="input-field" style={{ width: 90 }} placeholder={t("disposition.wrapTime")} value={crewWrapTime} onChange={(e) => setCrewWrapTime(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 100 }} placeholder={t("columns.notes")} value={crewNotes} onChange={(e) => setCrewNotes(e.target.value)} />
                            <button className="action-primary" style={{ whiteSpace: "nowrap" }} onClick={() => void handleAddCrewMember()} disabled={!crewName.trim()}>{t("common.add")}</button>
                          </div>
                        </article>
                      ) : null}

                      {/* Cast tab */}
                      {dispoTab === "cast" ? (
                        <article className="panel window-panel">
                          <div className="panel-titlebar compact">
                            <div><p className="section-tag">{t("disposition.tabCast")}</p><h3>{t("disposition.tabCast")}</h3></div>
                          </div>
                          <div className="data-grid-wrap">
                            <table className="data-grid">
                              <thead><tr><th>{t("disposition.castName")}</th><th>{t("disposition.character")}</th><th>{t("disposition.callTime")}</th><th>{t("disposition.scenes")}</th><th>{t("columns.notes")}</th><th className="align-right">{t("common.actions")}</th></tr></thead>
                              <tbody>
                                {selectedDisposition.castAssignments.length === 0 ? (
                                  <tr><td colSpan={6}>{t("disposition.noCast")}</td></tr>
                                ) : (
                                  selectedDisposition.castAssignments.map((cast) => (
                                    <tr key={cast.id}>
                                      <td>{cast.name}</td>
                                      <td>{cast.character ?? "-"}</td>
                                      <td>{cast.callTime ?? "-"}</td>
                                      <td>{cast.scenes ?? "-"}</td>
                                      <td>{cast.notes ?? "-"}</td>
                                      <td className="align-right"><button className="grid-delete" onClick={() => void handleDeleteCastMember(cast.id)} title={t("common.delete")}>✕</button></td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="form-inline" style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 8, borderTop: "1px solid var(--border)" }}>
                            <input className="input-field" style={{ flex: 2, minWidth: 120 }} placeholder={t("disposition.castName")} value={castName} onChange={(e) => setCastName(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 120 }} placeholder={t("disposition.character")} value={castCharacter} onChange={(e) => setCastCharacter(e.target.value)} />
                            <input className="input-field" style={{ width: 90 }} placeholder={t("disposition.callTime")} value={castCallTime} onChange={(e) => setCastCallTime(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 100 }} placeholder={t("disposition.scenes")} value={castScenes} onChange={(e) => setCastScenes(e.target.value)} />
                            <input className="input-field" style={{ flex: 2, minWidth: 100 }} placeholder={t("columns.notes")} value={castNotes} onChange={(e) => setCastNotes(e.target.value)} />
                            <button className="action-primary" style={{ whiteSpace: "nowrap" }} onClick={() => void handleAddCastMember()} disabled={!castName.trim()}>{t("common.add")}</button>
                          </div>
                        </article>
                      ) : null}
                    </div>
                  )}
                </article>

                <article className="panel form-panel">
                  <div className="panel-titlebar compact">
                    <div>
                      <p className="section-tag">{t("disposition.howToTitle")}</p>
                      <h3>{t("disposition.howToTitle")}</h3>
                    </div>
                  </div>
                  <div className="form-stack" style={{ color: "var(--text-2)", lineHeight: 1.5 }}>
                    <p>{t("disposition.howTo1")}</p>
                    <p>{t("disposition.howTo2")}</p>
                    <p>{t("disposition.howTo3")}</p>
                    <p>{t("disposition.howTo4")}</p>
                  </div>
                </article>
              </section>
            ) : null}
          </main>
        </div>

        <footer className="statusbar">
          <span>{t("status.view")}: {currentViewLabel}</span>
          <span>{t("status.projectStatus")}: {activeStatusLabel}</span>
          <span>{t("status.budgetPositions")}: {costCenters.length}</span>
          <span>{t("status.shootDays")}: {shootDays.length}</span>
          <span>{t("navigation.contacts")}: {contacts.length}</span>
          <span>{t("navigation.contracts")}: {contracts.length}</span>
          <span>{t("navigation.timeTracking")}: {timeEntries.length}</span>
        </footer>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      <UpdateNotice />
    </div>
  );
}
