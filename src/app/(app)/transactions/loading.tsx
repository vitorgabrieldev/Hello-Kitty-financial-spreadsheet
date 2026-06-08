import ListPageSkeleton from '@/components/ui/ListPageSkeleton'

export default function TransactionsLoading() {
  return <ListPageSkeleton rows={6} hasBalance />
}
