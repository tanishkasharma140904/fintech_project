export const monthlyExpenses = [
    { month: "Jan", amount: 18400 },
    { month: "Feb", amount: 22100 },
    { month: "Mar", amount: 19800 },
    { month: "Apr", amount: 27500 },
    { month: "May", amount: 24300 },
    { month: "Jun", amount: 31200 },
    { month: "Jul", amount: 28700 },
    { month: "Aug", amount: 33500 },
    { month: "Sep", amount: 29100 },
    { month: "Oct", amount: 35800 },
    { month: "Nov", amount: 42300 },
    { month: "Dec", amount: 38900 },
  ];
  
  export const categoryExpenses = [
    { name: "Food & Dining",  value: 12400, color: "#00d4aa" },
    { name: "Shopping",       value: 9800,  color: "#4d9fff" },
    { name: "Transport",      value: 5200,  color: "#f5a623" },
    { name: "Entertainment",  value: 4100,  color: "#c084fc" },
    { name: "Utilities",      value: 3800,  color: "#10d078" },
    { name: "Healthcare",     value: 2900,  color: "#ff4d6a" },
  ];
  
  export const aiInsights = [
    {
      id: "weekend-spending",
      icon: "🛍️",
      title: "Weekend spending is high",
      detail: "You spend 2.4× more on Sat–Sun than weekdays on average.",
      type: "warning",
    },
    {
      id: "food-delivery",
      icon: "🍕",
      title: "Food delivery increased 18%",
      detail: "Zomato & Swiggy orders rose sharply in the last 30 days.",
      type: "alert",
    },
    {
      id: "late-night-shopping",
      icon: "🌙",
      title: "Shopping spikes detected late night",
      detail: "68% of your impulse purchases happen between 11 PM – 2 AM.",
      type: "alert",
    },
    {
      id: "utilities-stable",
      icon: "✅",
      title: "Utility bills are stable",
      detail: "Electricity & internet costs unchanged for 3 months. Good job!",
      type: "info",
    },
    {
      id: "savings-opportunity",
      icon: "💡",
      title: "₹4,200 savings opportunity",
      detail: "Switching 3 subscriptions to annual plans saves ₹4,200/year.",
      type: "info",
    },
  ];
  
  export const sampleTransactions = [
    { id: 1, date: "2024-11-01", description: "Swiggy Order",         category: "Food & Dining", amount: -340  },
    { id: 2, date: "2024-11-02", description: "Uber Ride",            category: "Transport",     amount: -180  },
    { id: 3, date: "2024-11-03", description: "Salary Credit",        category: "Income",        amount: 85000 },
    { id: 4, date: "2024-11-04", description: "Amazon Purchase",      category: "Shopping",      amount: -2340 },
    { id: 5, date: "2024-11-05", description: "Netflix Subscription", category: "Entertainment", amount: -649  },
    { id: 6, date: "2024-11-06", description: "Electricity Bill",     category: "Utilities",     amount: -1820 },
    { id: 7, date: "2024-11-07", description: "Zomato Order",         category: "Food & Dining", amount: -520  },
    { id: 8, date: "2024-11-08", description: "Pharmacy",             category: "Healthcare",    amount: -390  },
  ];