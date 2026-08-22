/**
 * Card — reusable surface primitive.
 * Keeps the cyber theme consistent without repeating utility strings.
 */
export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag
      className={`bg-cyber-900/60 border border-slate-800 rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
