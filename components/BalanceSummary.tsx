// /components/BalanceSummary.tsx
export default function BalanceSummary({ balances, users }: any) {
  return (
    <div className="grid gap-3">
      {Object.entries(balances).map(([userId, amount]: any) => {
        const user = users.find((u: any) => u._id === userId)

        return (
          <div
            key={userId}
            className="flex justify-between p-3 border rounded-lg"
          >
            <span>{user?.name}</span>
            <span className={amount > 0 ? 'text-green-600' : 'text-red-500'}>
              ₹{amount.toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
