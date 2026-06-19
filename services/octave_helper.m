%% =============================================================
%  DIP Platform — Octave Helper (auto-injected before student code)
%% =============================================================

% Load required packages
try; pkg load image; catch; end
try; pkg load io; catch; end

% --- Platform variables ---
INPUT_IMAGE = getenv('INPUT_IMAGE');
if isempty(INPUT_IMAGE)
  INPUT_IMAGE = 'input.png';
end

WORK_DIR = getenv('WORK_DIR');
if ~isempty(WORK_DIR)
  cd(WORK_DIR);
end

% --- Helper functions ---
function img = imread_gray(path)
  if nargin < 1; path = INPUT_IMAGE; end
  img = imread(path);
  if size(img, 3) == 3
    img = rgb2gray(img);
  end
end

function img = imread_color(path)
  if nargin < 1; path = INPUT_IMAGE; end
  img = imread(path);
end

function info(varargin)
  for i = 1:2:length(varargin)
    name = varargin{i};
    val = varargin{i+1};
    if ismatrix(val)
      fprintf('%s: size=%s, class=%s\n', name, mat2str(size(val)), class(val));
    else
      fprintf('%s: %s\n', name, mat2str(val));
    end
  end
end
