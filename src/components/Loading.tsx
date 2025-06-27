interface LoadingProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  inline?: boolean;
  floating?: boolean;
}

export default function Loading({ 
  message = "Loading...", 
  size = 'md',
  fullScreen = false,
  inline = false,
  floating = false
}: LoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'h-4 w-4';
      case 'sm':
        return 'h-6 w-6';
      case 'md':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-8 w-8';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'xs':
        return 'text-xs';
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 border-purple-500 ${getSizeClasses()}`}></div>
  );

  if (inline) {
    return spinner;
  }

  if (floating) {
    return (
      <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl overflow-hidden border border-purple-200 p-4 flex flex-col gap-4 items-center justify-center">
          {spinner}
          <p className={`text-gray-600 ${getTextSize()}`}>{message}</p>
        </div>
      </div>
    );
  }

  const content = (
    <div className="text-center">
      <div className={`mx-auto mb-4 ${getSizeClasses()}`}>
        {spinner}
      </div>
      <p className={`text-gray-600 ${getTextSize()}`}>{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
} 