import { getApiUrl } from "./config"

export interface VehicleMaster {
  name: string
  license_plate: string
  make: string
  model: string
  last_odometer: number
  fuel_type: string
  location: string
  employee: string
  vehicle_value: number
  image?: string
}

export interface VehicleLogMaster {
  name: string
  license_plate: string
  job_cards_type?: string
  date_of_initiation?: string
  date_and_time_of_job_completion?: string
  current_odometer_value: number
  last_odometer_value: number
  status: string
  priority_level: string
  creation?: string
  problem_details?: Array<{ problem_details: string }>
  work_done_details?: Array<{ work_done_details: string }>
  part_details?: Array<{
    item_name: string
    qty: number
    expense: number
  }>
  lube_details?: Array<{
    item_name: string
    qty: number
    expense: number
  }>
  working_employee?: Array<{ employee: string }>
  pending_jobs_backlog_details?: Array<{ pending_jobsbacklog_details: string }>
}

export interface VehicleRefueling {
  name: string
  date: string
  issuer_name: string
  company: string
  source_warehouse: string
  fuel_item: string
  cost_center: string
  vehicle_refueling_details?: Array<{
    registration_no: string
    date: string
    fuel_qty_in_ltrs: number
    current_hmrkms: number
    fuel_consumption: number
  }>
}

export interface UtilizationReport {
  name: string
  date: string
  from_date?: string
  to_date?: string
  shift: string
  plant: string
  cost_center: string
  warehouse: string
  vehicle: string
  supervisor_name: string
  hmr: number
  status: string
}

async function fetchFrappeResource<T>(
  doctype: string,
  fields: string[] = ["name"],
  filters?: Record<string, any>
): Promise<T[]> {
  try {
    const fieldsParam = encodeURIComponent(JSON.stringify(fields))
    let url = `${getApiUrl(`/api/resource/${doctype}`)}?fields=${fieldsParam}&limit_page_length=2000`

    if (filters) {
      const filtersParam = encodeURIComponent(JSON.stringify(filters))
      url += `&filters=${filtersParam}`
    }

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.status === 403 || response.status === 401) {
      throw new Error("Session expired. Please login again.")
    }

    if (!response.ok) {
      throw new Error(`Frappe API Error: ${response.status}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error(`Error fetching ${doctype}:`, error)
    throw error
  }
}

export const vmsApi = {
  // Vehicle Master
  getVehicleMasters: (filters?: Record<string, any>) =>
    fetchFrappeResource<VehicleMaster>("Vehicle Master", [
      "name",
      "license_plate",
      "make",
      "model",
      "last_odometer",
      "fuel_type",
      "location",
      "employee",
      "vehicle_value",
      "image",
    ], filters),

  // Vehicle Log Master
  getVehicleLogMasters: (filters?: Record<string, any>) =>
    fetchFrappeResource<VehicleLogMaster>("Vehicle Log Master", [
      "name",
      "license_plate",
      "job_cards_type",
      "current_odometer_value",
      "last_odometer_value",
      "status",
      "priority_level",
      "creation"
    ], filters),
  
  // Vehicle Log Master (Details)
  getVehicleLogMasterDetails: async (name: string): Promise<VehicleLogMaster | null> => {
    try {
      const url = getApiUrl(`/api/resource/Vehicle Log Master/${name}`)
  
      const response = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      })
  
      if (!response.ok) {
        throw new Error(`Frappe API Error: ${response.status}`)
      }
  
      const result = await response.json()
      return result.data || null
  
    } catch (error) {
      console.error("Error fetching Vehicle Log Master details:", error)
      return null
    }
  },
  

  // Vehicle Refueling
  getVehicleRefuelings: (filters?: Record<string, any>) =>
    fetchFrappeResource<VehicleRefueling>("Vehicle Refueling", [
      "name",
      "date",
      "issuer_name",
      "company",
      "source_warehouse",
      "fuel_item",
      "cost_center",
      "vehicle_refueling_details",
    ], filters),

  // Utilization Report
  getUtilizationReports: (filters?: Record<string, any>) =>
    fetchFrappeResource<UtilizationReport>("Utilization Report", [
      "name",
      "date",
      "from_date",
      "to_date",
      "shift",
      "plant",
      "cost_center",
      "warehouse",
      "vehicle",
      "supervisor_name",
      "hmr",
      "status",
    ], filters),
}

