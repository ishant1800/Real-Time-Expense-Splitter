export interface UserNetBalance {
  userId: string;
  name: string;
  netBalance: number;
}

export interface SimplifiedTransaction {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export class DebtSimplifierService {
  /**
   * Simplifies group debts by calculating the minimum set of transactions.
   * Time Complexity: O(n log n)
   * 
   * Greedy Algorithm Explanation:
   * 1. Separate users into "debtors" (net balance < 0) and "creditors" (net balance > 0).
   * 2. Sort debtors ascending (most negative first) and creditors descending (most positive first).
   * 3. Match the largest debtor (owes the most) with the largest creditor (is owed the most).
   * 4. Calculate the transaction amount: amount = min(abs(debtor.balance), creditor.balance).
   * 5. Record that debtor pays creditor this amount.
   * 6. Update balances. If either is still non-zero (within decimal precision), re-insert them
   *    back into the sorted list using binary search insertion (takes O(log n) time).
   * 7. Repeat until all balances are settled (lists are empty).
   * 
   * Sorting takes O(n log n). There are at most n transactions, and each binary insertion takes O(log n).
   * Therefore, total time complexity is O(n log n).
   */
  simplifyDebts(balances: UserNetBalance[]): SimplifiedTransaction[] {
    const transactions: SimplifiedTransaction[] = [];

    // Filter debtors and creditors (ignoring users with zero balances)
    // Threshold is set to 0.01 to ignore minor rounding differences
    const debtors: UserNetBalance[] = [];
    const creditors: UserNetBalance[] = [];

    balances.forEach((b) => {
      const rounded = Math.round(b.netBalance * 100) / 100;
      if (rounded < -0.01) {
        debtors.push({ ...b, netBalance: rounded });
      } else if (rounded > 0.01) {
        creditors.push({ ...b, netBalance: rounded });
      }
    });

    // Sort debtors: ascending (most negative first: -50, -30, -10)
    debtors.sort((a, b) => a.netBalance - b.netBalance);

    // Sort creditors: descending (most positive first: 50, 30, 10)
    creditors.sort((a, b) => b.netBalance - a.netBalance);

    // Greedy matching loop
    while (debtors.length > 0 && creditors.length > 0) {
      // Pop the largest debtor and creditor (takes O(1) time)
      const debtor = debtors.shift()!;
      const creditor = creditors.shift()!;

      const debtorOwes = Math.abs(debtor.netBalance);
      const creditorOwed = creditor.netBalance;

      // Settle the minimum of what is owed vs what is creditor expects
      const settleAmount = Math.round(Math.min(debtorOwes, creditorOwed) * 100) / 100;

      transactions.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: settleAmount,
      });

      // Update balances
      const remainingDebtor = Math.round((debtor.netBalance + settleAmount) * 100) / 100;
      const remainingCreditor = Math.round((creditor.netBalance - settleAmount) * 100) / 100;

      // Re-insert if debtor still has remaining debt (insert sorted in O(log n))
      if (remainingDebtor < -0.01) {
        debtor.netBalance = remainingDebtor;
        this.binaryInsertDebtor(debtors, debtor);
      }

      // Re-insert if creditor still has remaining balance (insert sorted in O(log n))
      if (remainingCreditor > 0.01) {
        creditor.netBalance = remainingCreditor;
        this.binaryInsertCreditor(creditors, creditor);
      }
    }

    return transactions;
  }

  /**
   * Helper that inserts a debtor into an ascending sorted array in O(log n) time.
   */
  private binaryInsertDebtor(list: UserNetBalance[], item: UserNetBalance): void {
    let low = 0;
    let high = list.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (list[mid].netBalance < item.netBalance) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    list.splice(low, 0, item);
  }

  /**
   * Helper that inserts a creditor into a descending sorted array in O(log n) time.
   */
  private binaryInsertCreditor(list: UserNetBalance[], item: UserNetBalance): void {
    let low = 0;
    let high = list.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (list[mid].netBalance > item.netBalance) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    list.splice(low, 0, item);
  }
}
