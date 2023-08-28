export default function LoadingSpinner({
  radius = 30,
  fillAmount = 0.4,
  strokeWidth = 7
}: {
  radius?: number
  fillAmount?: number
  strokeWidth?: number
}) {
  return (
    <svg className="animate-spin" width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
      <circle opacity="0.25" cx="50%" cy="50%" r={radius} fill="transparent" stroke="green" strokeWidth={strokeWidth.toString()}/>
      <circle cx="50%" cy="50%" r={radius} fill="transparent" stroke="green" strokeWidth={strokeWidth.toString()} strokeLinecap="round"
        strokeDasharray={3.14 * radius * 2} strokeDashoffset={3.14 * (1 - fillAmount) * radius * 2} />
    </svg>
  );
}