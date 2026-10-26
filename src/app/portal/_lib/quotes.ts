// quotes.status values as people see them. 'sent' means "requested by the customer, waiting on B&M.ai".
export const QUOTE_STATUS: Record<string, string> = {
  draft: "Draft",
  sent: "Requested",
  accepted: "Confirmed",
  invoiced: "Invoiced",
  paid: "Paid",
  cancelled: "Cancelled",
};
