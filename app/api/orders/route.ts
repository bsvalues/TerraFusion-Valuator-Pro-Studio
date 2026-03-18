import { NextResponse } from "next/server";
import type { AppraisalOrder } from "@/lib/types";

// In-memory store (replace with DB in production)
let orders: AppraisalOrder[] = [
  {
    id: "TF-26-0042",
    fileNumber: "TF-26-0042",
    status: "analysis",
    propertyAddress: "1847 Oak Ridge Drive",
    city: "Austin",
    state: "TX",
    zip: "78703",
    county: "Travis",
    propertyType: "single_family",
    clientName: "First National Bank",
    clientEmail: "orders@fnb.com",
    lenderName: "First National Bank",
    borrowerName: "James & Sarah Mitchell",
    loanNumber: "FNB-2026-88421",
    loanType: "Conventional",
    purpose: "Refinance",
    fee: 650,
    feeStatus: "pending",
    orderedDate: "2026-03-10",
    inspectionDate: "2026-03-13",
    dueDate: "2026-03-20",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "Rush order — client needs by 3/20. Pool and detached garage to be measured.",
    priority: "rush",
    formType: "URAR_1004",
  },
  {
    id: "TF-26-0041",
    fileNumber: "TF-26-0041",
    status: "draft",
    propertyAddress: "4201 Congress Ave, Suite 300",
    city: "Austin",
    state: "TX",
    zip: "78751",
    county: "Travis",
    propertyType: "office",
    clientName: "Lone Star Capital",
    clientEmail: "appraisals@lonestarcap.com",
    lenderName: "Lone Star Capital",
    borrowerName: "Westside Properties LLC",
    loanNumber: "LSC-2026-00312",
    loanType: "Commercial",
    purpose: "Purchase",
    fee: 4500,
    feeStatus: "invoiced",
    orderedDate: "2026-03-05",
    inspectionDate: "2026-03-08",
    dueDate: "2026-03-25",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "3-story office building, 18,500 SF rentable. Rent roll attached.",
    priority: "normal",
    formType: "Commercial_Narrative",
  },
  {
    id: "TF-26-0040",
    fileNumber: "TF-26-0040",
    status: "delivered",
    propertyAddress: "892 Riverside Blvd",
    city: "Round Rock",
    state: "TX",
    zip: "78664",
    county: "Williamson",
    propertyType: "single_family",
    clientName: "Texas Mortgage Group",
    clientEmail: "appraisals@txmortgage.com",
    lenderName: "Texas Mortgage Group",
    borrowerName: "David & Linda Park",
    loanNumber: "TMG-2026-44210",
    loanType: "FHA",
    purpose: "Purchase",
    fee: 575,
    feeStatus: "paid",
    orderedDate: "2026-03-01",
    inspectionDate: "2026-03-03",
    dueDate: "2026-03-10",
    deliveredDate: "2026-03-09",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "FHA case number required. Property meets MPR.",
    priority: "normal",
    formType: "URAR_1004",
  },
  {
    id: "TF-26-0039",
    fileNumber: "TF-26-0039",
    status: "intake",
    propertyAddress: "3301 Industrial Pkwy",
    city: "Pflugerville",
    state: "TX",
    zip: "78660",
    county: "Travis",
    propertyType: "industrial",
    clientName: "Capital City Lending",
    clientEmail: "orders@capitalcitylending.com",
    lenderName: "Capital City Lending",
    borrowerName: "Pflugerville Industrial LLC",
    loanNumber: "CCL-2026-00891",
    loanType: "Commercial",
    purpose: "Refinance",
    fee: 6500,
    feeStatus: "pending",
    orderedDate: "2026-03-17",
    dueDate: "2026-04-10",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "42,000 SF flex industrial. Crane rails present. Environmental Phase I required.",
    priority: "normal",
    formType: "Commercial_Narrative",
  },
  {
    id: "TF-26-0038",
    fileNumber: "TF-26-0038",
    status: "review",
    propertyAddress: "1122 South Lamar Blvd",
    city: "Austin",
    state: "TX",
    zip: "78704",
    county: "Travis",
    propertyType: "retail",
    clientName: "Meridian Bank",
    clientEmail: "appraisals@meridianbank.com",
    lenderName: "Meridian Bank",
    borrowerName: "South Lamar Retail LLC",
    loanNumber: "MER-2026-00217",
    loanType: "Commercial",
    purpose: "Refinance",
    fee: 3800,
    feeStatus: "invoiced",
    orderedDate: "2026-03-03",
    inspectionDate: "2026-03-06",
    dueDate: "2026-03-22",
    appraiserName: "Robert Chen, MAI",
    appraiserLicense: "TX-1234567",
    notes: "Strip retail center, 3 tenants. NNN leases. Rent roll and leases provided.",
    priority: "normal",
    formType: "Commercial_Narrative",
  },
];

export async function GET() {
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Partial<AppraisalOrder>;
    const year = new Date().getFullYear().toString().slice(-2);
    const num = Math.floor(Math.random() * 9000) + 1000;
    const id = `TF-${year}-${num}`;

    const newOrder: AppraisalOrder = {
      status: "intake",
      propertyAddress: "",
      city: "",
      state: "TX",
      zip: "",
      county: "",
      propertyType: "single_family",
      clientName: "",
      orderedDate: new Date().toISOString().slice(0, 10),
      priority: "normal",
      ...body,
      id,
      fileNumber: id,
    };

    orders.unshift(newOrder);
    return NextResponse.json({ order: newOrder });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create order" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id: string } & Partial<AppraisalOrder>;
    const { id, ...updates } = body;
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    orders[idx] = { ...orders[idx], ...updates };
    return NextResponse.json({ order: orders[idx] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update order" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    orders = orders.filter((o) => o.id !== id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete order" },
      { status: 400 }
    );
  }
}
