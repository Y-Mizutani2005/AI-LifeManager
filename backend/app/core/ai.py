"""
AI/Semantic Kernel設定

OpenAIとSemantic Kernelの初期化と管理
"""

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion
from app.core.config import settings


# グローバルKernelインスタンス
_kernel: Kernel | None = None


def initialize_kernel() -> Kernel:
    """
    Semantic Kernelを初期化
    
    Returns:
        Kernel: 初期化されたSemantic Kernelインスタンス
        
    Raises:
        ValueError: OpenAI APIキーが設定されていない場合
    """
    global _kernel
    
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY が .env ファイルに設定されていません")
    
    # 新しいKernelインスタンスを作成
    kernel = Kernel()
    
    # OpenAI接続設定
    service_id = "chat"
    kernel.add_service(
        OpenAIChatCompletion(
            service_id=service_id,
            ai_model_id=settings.openai_model,
            api_key=settings.openai_api_key
        )
    )
    
    _kernel = kernel
    return kernel


def get_kernel() -> Kernel:
    """
    初期化済みのKernelインスタンスを取得
    
    Returns:
        Kernel: Semantic Kernelインスタンス
        
    Raises:
        RuntimeError: Kernelが初期化されていない場合
    """
    if _kernel is None:
        raise RuntimeError("Kernel が初期化されていません。initialize_kernel() を先に呼び出してください。")
    return _kernel
