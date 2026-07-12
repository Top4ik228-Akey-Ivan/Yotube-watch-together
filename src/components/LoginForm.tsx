import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Tabs, Card, Typography, Alert } from 'antd';
import { YoutubeOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { authSchema, type AuthFormValues } from '../schemas/authSchema';
import { rootStore } from '../stores/rootStore';

const { Title, Text } = Typography;

const LoginForm: React.FC = () => {
    // 1. Автоматически ищем ID комнаты в ссылке (?room=ID)
    const queryParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = queryParams.get('room');

    // 2. Инициализируем React Hook Form с нашей Zod схемой
    const {
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { errors, isValid },
    } = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            mode: roomIdFromUrl ? 'guest' : 'host',
            username: '',
            videoUrl: '',
            roomId: roomIdFromUrl || '',
        },
        mode: 'onTouched',
    });

    // Наблюдаем за выбранным режимом ('host' или 'guest') для переключения инпутов
    const currentMode = watch('mode');

    // Если ссылка обновилась в процессе, подтягиваем ID заново
    useEffect(() => {
        if (roomIdFromUrl) {
            setValue('mode', 'guest');
            setValue('roomId', roomIdFromUrl, { shouldValidate: true });
        }
    }, [roomIdFromUrl, setValue]);

    // 3. Отправка формы (срабатывает, если всё заполнено верно)
    const onSubmit = (data: AuthFormValues) => {

        const isHost = data.mode === 'host';
        if (isHost) {
            // Здесь будет запуск MobX:
            rootStore.userStore.loginUser(data.username, isHost);
            rootStore.p2pStore.initRoomAsHost(data.videoUrl || '');
        } else {
            // Здесь будет запуск MobX:
            rootStore.userStore.loginUser(data.username, false);
            rootStore.p2pStore.connectToRoomAsGuest(data.roomId || '');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f0f14] p-4 font-sans">
            <Card className="w-full max-w-md bg-[#1a1a24] border-gray-800 shadow-2xl backdrop-blur-md bg-opacity-95">

                {/* Шапка формы */}
                <div className="text-center mb-6">
                    <Title level={2} className="text-emerald-500! m-0! font-bold!">
                        📺 P2P YouTube Cinema
                    </Title>
                    <Text className="text-gray-400">Смотрите видео вместе напрямую через WebRTC</Text>
                </div>

                {/* Уведомление для приглашенного друга */}
                {roomIdFromUrl && (
                    <Alert
                        title="Вы перешли по приглашению друга"
                        type="info"
                        showIcon
                        className="mb-4 bg-emerald-950/30 border-emerald-800 text-emerald-400"
                    />
                )}

                {/* Переключатель вкладок Ant Design */}
                <Tabs
                    activeKey={currentMode}
                    onChange={(key) => setValue('mode', key as 'host' | 'guest', { shouldValidate: true })}
                    centered
                    className="mb-4"
                    items={[
                        {
                            key: 'host',
                            label: (
                                <span className="text-gray-300">
                                    <YoutubeOutlined className="text-red-500" /> Создать комнату
                                </span>
                            ),
                        },
                        {
                            key: 'guest',
                            label: (
                                <span className="text-gray-300">
                                    <UsergroupAddOutlined /> Войти к другу
                                </span>
                            ),
                        },
                    ]}
                />

                {/* Сама HTML-форма */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

                    {/* ПОЛЕ №1: Ваше имя (Показывается всегда) */}
                    <div className="flex flex-col gap-1">
                        <label className="text-gray-400 text-sm font-medium">Ваше имя</label>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field} // Передает value, onChange, onBlur из React Hook Form в AntD
                                    size="large"
                                    placeholder="Введите никнейм..."
                                    status={errors.username ? 'error' : ''}
                                    className="bg-[#242432] border-gray-700 text-white hover:border-emerald-500 focus:border-emerald-500"
                                />
                            )}
                        />
                        {errors.username && (
                            <span className="text-red-400 text-xs mt-0.5">{errors.username.message}</span>
                        )}
                    </div>

                    {/* ПОЛЕ №2: Ссылка на видео (Только для Создателя) */}
                    {currentMode === 'host' && (
                        <div className="flex flex-col gap-1">
                            <label className="text-gray-400 text-sm font-medium">Ссылка на YouTube видео</label>
                            <Controller
                                name="videoUrl"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        size="large"
                                        placeholder="https://youtube.com..."
                                        status={errors.videoUrl ? 'error' : ''}
                                        className="bg-[#242432] border-gray-700 text-white hover:border-emerald-500 focus:border-emerald-500"
                                    />
                                )}
                            />
                            {errors.videoUrl && (
                                <span className="text-red-400 text-xs mt-0.5">{errors.videoUrl.message}</span>
                            )}
                        </div>
                    )}

                    {/* ПОЛЕ №3: Код комнаты (Только для Гостя) */}
                    {currentMode === 'guest' && (
                        <div className="flex flex-col gap-1">
                            <label className="text-gray-400 text-sm font-medium">ID Комнаты (Код друга)</label>
                            <Controller
                                name="roomId"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        size="large"
                                        placeholder="Введите ID сессии..."
                                        disabled={!!roomIdFromUrl}
                                        status={errors.roomId ? 'error' : ''}
                                        className="bg-[#242432] border-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-500"
                                    />
                                )}
                            />
                            {errors.roomId && (
                                <span className="text-red-400 text-xs mt-0.5">{errors.roomId.message}</span>
                            )}
                        </div>
                    )}

                    {/* Кнопка отправки формы */}
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        disabled={!isValid} // Заблокирована, пока Zod не подтвердит валидность данных
                        className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 border-none font-semibold disabled:bg-gray-800 disabled:text-gray-600"
                    >
                        {currentMode === 'host' ? 'Создать кинотеатр' : 'Присоединиться к просмотру'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default LoginForm;