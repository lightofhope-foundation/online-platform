type DashboardGreetingProps = {
  firstName: string | null;
};

export function DashboardGreeting({ firstName }: DashboardGreetingProps) {
  const label = firstName?.trim()
    ? `Hallo ${firstName.trim()}`
    : "Hallo";

  return (
    <div className="mb-8 text-center px-2">
      <h1 className="typo-greeting font-normal tracking-tight text-[#63eca9] truncate max-w-full mx-auto">
        {label}
      </h1>
    </div>
  );
}
