type RoutePlaceholderProps = {
	title: string;
};

export const RoutePlaceholder = ({ title }: RoutePlaceholderProps) => {
	return <div>{title}</div>;
};
